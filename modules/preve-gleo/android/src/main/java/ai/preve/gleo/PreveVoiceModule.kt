package ai.preve.gleo
import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.MediaPlayer
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.io.File
class PreveVoiceModule: Module(){
 @Volatile private var recording=false
 @Volatile private var speech=false
 @Volatile private var lastSpeech=0L
 private var started=0L
 private var recorder:AudioRecord?=null
 private var worker:Thread?=null
 private var buffer=ByteArrayOutputStream()
 private var player:MediaPlayer?=null
 private var audioFile:File?=null
 private fun cancelRecording(){recording=false;runCatching{recorder?.stop()};worker?.join(1500);recorder?.release();recorder=null;worker=null}
 private fun stopAudio(){runCatching{player?.stop()};player?.release();player=null;audioFile?.delete();audioFile=null}
 override fun definition()=ModuleDefinition{
  Name("PreveVoice")
  AsyncFunction("start"){
   val context=appContext.reactContext?:error("VOICE_UNAVAILABLE")
   require(context.packageName=="com.jb8.preve.pleos")
   require(context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)
   cancelRecording();stopAudio();buffer=ByteArrayOutputStream()
   val size=maxOf(4096,AudioRecord.getMinBufferSize(16000,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT))
   val record=AudioRecord(MediaRecorder.AudioSource.MIC,16000,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT,size)
   require(record.state==AudioRecord.STATE_INITIALIZED)
   recorder=record;record.startRecording();recording=true;speech=false;lastSpeech=0L;started=System.currentTimeMillis()
   worker=Thread{
    val chunk=ByteArray(size)
    try{while(recording&&buffer.size()<640000){val count=record.read(chunk,0,minOf(size,640000-buffer.size()));if(count<=0)break;buffer.write(chunk,0,count)
     var peak=0
     for(i in 0 until count-1 step 2){val sample=(chunk[i].toInt() and 255) or (chunk[i+1].toInt() shl 8);peak=maxOf(peak,kotlin.math.abs(sample.toShort().toInt()))}
     if(peak>900){speech=true;lastSpeech=System.currentTimeMillis()}}}finally{recording=false;runCatching{record.stop()}}
   }.apply{start()}
   true
  }
  AsyncFunction("status"){
   val now=System.currentTimeMillis()
   mapOf("done" to (!recording || (speech && now-lastSpeech>1400) || (!speech && now-started>8000)),"speech" to speech)
  }
  AsyncFunction("stop"){
   cancelRecording();val bytes=buffer.toByteArray();buffer.reset();require(bytes.size>=3200)
   Base64.encodeToString(bytes,Base64.NO_WRAP)
  }
  AsyncFunction("cancel"){cancelRecording();buffer.reset();stopAudio();true}
  AsyncFunction("isPlaying"){runCatching{player?.isPlaying==true}.getOrDefault(false)}
  AsyncFunction("play"){content:String ->
   require(content.length<=4000000);stopAudio()
   val context=appContext.reactContext?:error("VOICE_UNAVAILABLE")
   val file=File.createTempFile("preve-voice-",".wav",context.cacheDir);audioFile=file
   file.writeBytes(Base64.decode(content,Base64.DEFAULT))
   player=MediaPlayer().apply{setDataSource(file.absolutePath);setOnCompletionListener{stopAudio()};prepare();start()};true
  }
  OnDestroy{cancelRecording();stopAudio()}
 }
}
