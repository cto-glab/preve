package ai.preve.auth

import android.app.Activity
import android.content.MutableContextWrapper
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.common.api.Scope
import com.google.android.gms.common.api.ApiException
import expo.modules.kotlin.Promise
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicBoolean

class GoogleSignInCancelledException : CodedException("Google sign-in cancelled")
class GoogleSignInUnavailableException : CodedException("Google sign-in unavailable")
class GoogleSignInFailedException : CodedException("Google sign-in failed")
class GoogleSignInBusyException : CodedException("Google sign-in already in progress")

class PreveGoogleAuthModule : Module() {
  private val busy = AtomicBoolean(false)
  private var calendarPromise: Promise? = null
  private val calendarRequestCode = 48017
  private val calendarScope = "https://www.googleapis.com/auth/calendar.events.readonly"
  private fun finishCalendar(result: AuthorizationResult, promise: Promise) {
    val token = result.accessToken
    if (token.isNullOrBlank() || !result.grantedScopes.contains(calendarScope)) {
      promise.reject("CALENDAR_PERMISSION_REQUIRED", "Calendar read permission is required", null)
    } else { promise.resolve(mapOf("accessToken" to token)) }
  }
  override fun definition() = ModuleDefinition {
    Name("PreveGoogleAuth")
    AsyncFunction("signIn") Coroutine { clientId: String, nonce: String ->
      if (!busy.compareAndSet(false, true)) throw GoogleSignInBusyException()
      try {
        if (!clientId.endsWith(".apps.googleusercontent.com") || nonce.length < 32) throw GoogleSignInUnavailableException()
        val activity = appContext.currentActivity ?: throw GoogleSignInUnavailableException()
        withContext(Dispatchers.Main) {
          val context = MutableContextWrapper(activity)
          val option = GetSignInWithGoogleOption.Builder(clientId).setNonce(nonce).build()
          val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
          val credential = CredentialManager.create(context).getCredential(context, request).credential
          if (credential !is CustomCredential || credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) throw GoogleSignInFailedException()
          val token = GoogleIdTokenCredential.createFrom(credential.data).idToken
          mapOf("idToken" to token)
        }
      } catch (error: GetCredentialCancellationException) {
        throw GoogleSignInCancelledException()
      } catch (error: CodedException) {
        throw error
      } catch (error: Exception) {
        // Never expose Google credentials or provider exception bodies to JavaScript logs.
        throw GoogleSignInFailedException()
      } finally { busy.set(false) }
    }
    AsyncFunction("authorizeCalendar") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null || calendarPromise != null) {
        promise.reject("CALENDAR_BUSY", "Calendar authorization unavailable", null)
      } else {
        calendarPromise = promise
        activity.runOnUiThread {
          val request = AuthorizationRequest.builder()
            .setRequestedScopes(listOf(Scope(calendarScope), Scope("openid"))).build()
          Identity.getAuthorizationClient(activity).authorize(request)
            .addOnSuccessListener { result ->
              if (result.hasResolution()) {
                try {
                  activity.startIntentSenderForResult(result.pendingIntent!!.intentSender, calendarRequestCode, null, 0, 0, 0)
                } catch (_: Exception) {
                  calendarPromise = null
                  promise.reject("CALENDAR_AUTH_FAILED", "Calendar authorization failed", null)
                }
              } else { calendarPromise = null; finishCalendar(result, promise) }
            }
            .addOnFailureListener { error ->
              calendarPromise = null
              val status = (error as? ApiException)?.statusCode
              promise.reject(if (status != null) "CALENDAR_GOOGLE_$status" else "CALENDAR_AUTH_FAILED", "Calendar authorization failed", null)
            }
        }
      }
    }
    OnActivityResult { activity, payload ->
      if (payload.requestCode == calendarRequestCode) {
        val promise = calendarPromise
        calendarPromise = null
        if (promise != null) {
          if (payload.resultCode != Activity.RESULT_OK) {
            promise.reject("CALENDAR_CANCELLED", "Calendar authorization cancelled", null)
          } else {
            try { finishCalendar(Identity.getAuthorizationClient(activity).getAuthorizationResultFromIntent(payload.data), promise) }
            catch (error: Exception) {
              val status = (error as? ApiException)?.statusCode
              promise.reject(if (status != null) "CALENDAR_GOOGLE_$status" else "CALENDAR_AUTH_FAILED", "Calendar authorization failed", null)
            }
          }
        }
      }
    }
    OnDestroy {
      calendarPromise?.reject("CALENDAR_CANCELLED", "Calendar authorization cancelled", null)
      calendarPromise = null
    }
    AsyncFunction("clearCredentialState") Coroutine { ->
      val context = appContext.reactContext ?: throw GoogleSignInUnavailableException()
      CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
    }
  }
}
