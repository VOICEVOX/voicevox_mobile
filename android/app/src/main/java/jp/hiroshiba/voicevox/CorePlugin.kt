package jp.hiroshiba.voicevox

import android.app.Activity
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

@CapacitorPlugin(name = "VoicevoxCore")
class CorePlugin : Plugin() {
    var core: VoicevoxCore? = null
    override fun load() {
        val modelPath: String = try {
            extractIfNotFound("model.zip")
        } catch (e: IOException) {
            throw RuntimeException(e)
        }
        core = VoicevoxCore(modelPath)
    }

    @PluginMethod
    fun getVersion(call: PluginCall) {
        val ret = JSObject()
        ret.put("value", core!!.voicevoxGetVersion())
        call.resolve(ret)
    }

    @PluginMethod
    fun getSupportedDevicesJson(call: PluginCall) {
        val ret = JSObject()
        ret.put("value", core!!.voicevoxGetSupportedDevicesJson())
        call.resolve(ret)
    }

    @PluginMethod
    fun getMetasJson(call: PluginCall) {
        val ret = JSObject()
        ret.put("value", core!!.voicevoxGetMetasJson())
        call.resolve(ret)
    }

    @Throws(IOException::class)
    private fun extractIfNotFound(archive: String): String {
        val context = context
        val filesDir = context.filesDir.absolutePath
        val dirName = File(archive).name

        val modelRoot = File(filesDir, dirName)
        if (modelRoot.exists()) {
            Log.i("extractIfNotFound", "Already exists (${modelRoot.absolutePath})")
            return modelRoot.absolutePath
        }
        Log.i("extractIfNotFound", "Extracting to ${modelRoot.absolutePath}")
        modelRoot.mkdir()
        val act: Activity = activity
        val model = act.assets.open(archive)
        val input = ZipInputStream(model)
        var entry: ZipEntry?

        while (input.nextEntry.also { entry = it } != null) {
            if (entry!!.isDirectory) {
                continue
            }
            val fileName = entry!!.name
            val file = File(modelRoot, fileName)
            file.parentFile?.mkdirs()
            val out = FileOutputStream(file)
            val buffer = ByteArray(1024)
            var len: Int
            Log.i("extractIfNotFound", "Extracting $fileName")
            while (input.read(buffer).also { len = it } > 0) {
                out.write(buffer, 0, len)
            }
        }
        input.close()
        model.close()
        Log.i("extractIfNotFound", "Done")
        return modelRoot.absolutePath
    }
}
