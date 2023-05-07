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

    @PluginMethod
    fun initialize(call: PluginCall) {
        val dictPath: String = try {
            // assets内のフォルダにパスでアクセスする方法が見付からなかったので
            // 1度filesに展開している。もっといい解決法があるかも。
            extractIfNotFound("openjtalk_dict.zip")
        } catch (e: IOException) {
            throw RuntimeException(e)
        }
        val result = core!!.voicevoxInitialize(
                dictPath,
        )
        if (result == 0) {
            call.resolve()
        } else {
            call.reject(core!!.voicevoxErrorResultToMessage(result))
        }
    }

    @Throws(IOException::class)
    private fun extractIfNotFound(archiveName: String): String {
        val filesDir = context.filesDir.absolutePath
        val dirName = File(archiveName).nameWithoutExtension

        val act: Activity = activity
        val archive = act.assets.open(archiveName)
        val shaSumFile = act.assets.open("$archiveName.sha256")
        val shaSumReader = shaSumFile.bufferedReader()
        val shaSum = shaSumReader.readLine()
        shaSumReader.close()
        shaSumFile.close()

        val destRoot = File(filesDir, dirName)
        val destHash = File(destRoot, ".sha256")
        if (destHash.exists() && destHash.readText() == shaSum) {
            Log.i("extractIfNotFound", "Up to date (${destRoot.absolutePath})")
            return destRoot.absolutePath
        } else if (destHash.exists()) {
            Log.i("extractIfNotFound", "Outdated (Hashes don't match)")
        } else {
            Log.i("extractIfNotFound", "Not exists")
        }
        Log.i("extractIfNotFound", "Extracting to ${destRoot.absolutePath}")
        destRoot.mkdir()
        val input = ZipInputStream(archive)
        var entry: ZipEntry?

        while (input.nextEntry.also { entry = it } != null) {
            if (entry!!.isDirectory) {
                continue
            }
            val fileName = entry!!.name
            val file = File(destRoot, fileName)
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
        archive.close()
        destHash.writeText(shaSum)
        Log.i("extractIfNotFound", "Done")
        return destRoot.absolutePath
    }
}
