package ai.preve.gleo
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.util.UUID

class PreveGleoModule : Module() {
 private val actions = setOf("GET_PREVE_MEETINGS", "GET_PREVE_BRIEFING", "GET_PREVE_EVIDENCE")
 private val queue = java.util.ArrayDeque<Intent>()
 private var initialRead = false
 private val pending = mutableMapOf<String, String>()
 // The official example uses ACTION_PARAM; its prose also allows individual extras.
 // Keep invalid/unknown parameters visible to the strict JS validator.
 private fun readParameters(intent: Intent): String = runCatching {
  val extras = intent.extras ?: return@runCatching "{}"
  for (key in listOf("ACTION_PARAM", "actionParameters")) {
   if (extras.containsKey(key)) return@runCatching (extras.get(key) as? String) ?: "null"
  }
  val params = JSONObject()
  for (key in extras.keySet()) {
   val value = extras.get(key)
   params.put(key, if (value is String) value else JSONObject.NULL)
  }
  params.toString()
 }.getOrDefault("null")
 override fun definition() = ModuleDefinition {
  Name("PreveGleo")
  OnNewIntent { intent -> synchronized(queue) { if (intent.action in actions && queue.size < 4) queue.add(Intent(intent)) } }
  AsyncFunction("takePending") {
   if (appContext.reactContext?.packageName != "com.jb8.preve.pleos") return@AsyncFunction null
   val intent = synchronized(queue) {
    if (!initialRead) { initialRead = true; appContext.currentActivity?.intent?.takeIf { it.action in actions } }
    else queue.poll()
   } ?: return@AsyncFunction null
   val action = intent.action ?: return@AsyncFunction null
   val raw = readParameters(intent)
   if (pending.size >= 8) pending.clear()
   val id = UUID.randomUUID().toString(); pending[id] = action
   mapOf("id" to id, "action" to action, "raw" to raw.take(4097))
  }
  AsyncFunction("respond") { id: String, raw: String ->
   val action = pending.remove(id) ?: return@AsyncFunction false
   require(raw.length <= 24000)
   val response = JSONObject(raw)
   require(response.getString("functionName") == action)
   require(response.getString("status") in setOf("success", "asking", "fail"))
   val context = appContext.reactContext ?: return@AsyncFunction false
   context.sendBroadcast(Intent("ai.pleos.playground.intent.action.APP_ACTION_RESPONSE").apply {
    putExtra("packageName", "com.jb8.preve.pleos"); putExtra("response", response.toString())
   })
   android.util.Log.i("PreveGleo", "callback_sent function=$action status=${response.getString("status")}")
   true
  }
 }
}
