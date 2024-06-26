package jp.hiroshiba.voicevox

import android.app.Activity
import android.system.Os
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.gson.Gson
import jp.hiroshiba.voicevoxcore.*
import java.io.File
import java.io.FileFilter
import java.io.FileOutputStream
import java.io.IOException
import java.util.Base64
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

@CapacitorPlugin(name = "VoicevoxCore")
class CorePlugin : Plugin() {
    lateinit var openJtalk: OpenJtalk
    lateinit var synthesizer: Synthesizer
    lateinit var voiceModels: List<VoiceModel>
    lateinit var gson: Gson

    @PluginMethod
    fun getVersion(call: PluginCall) {
        val ret = JSObject()
        ret.put("value", BuildConfig.VERSION_NAME)
        call.resolve(ret)
    }

    @PluginMethod
    fun getSupportedDevicesJson(call: PluginCall) {
        val ret = JSObject()
        val supportedDevices = GlobalInfo.getSupportedDevices()
        val supportedDevicesJson = gson.toJson(supportedDevices)
        ret.put("value", supportedDevicesJson)
        call.resolve(ret)
    }

    @PluginMethod
    fun getMetasJson(call: PluginCall) {
        val ret = JSObject()
        val flatMetas = voiceModels.flatMap { it.metas.asIterable() }
        val metas = flatMetas.map { it.speakerUuid }.toSet().map { speakerUuid ->
            val baseMetas = flatMetas.filter { it.speakerUuid == speakerUuid }
            val styles = baseMetas.flatMap { it.styles.asIterable() }
            val mergedMetas =
                gson.toJsonTree(baseMetas[0]).asJsonObject
            mergedMetas.add("styles", gson.toJsonTree(styles))

            mergedMetas
        }
        val metasJson = gson.toJson(metas)
        ret.put("value", metasJson)
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
        val modelPath: File = try {
            File(extractIfNotFound("model.zip"))
        } catch (e: IOException) {
            throw RuntimeException(e)
        }
        try {
            gson = Gson()
            Log.i("CorePlugin", "Initializing OpenJtalk")
            openJtalk = OpenJtalk(dictPath)

            Log.i("CorePlugin", "Initializing Synthesizer")
            synthesizer = Synthesizer.builder(openJtalk).build()

            Log.i("CorePlugin", "Initializing VoiceModels")
            val vvms = modelPath.listFiles(FileFilter { it.name.endsWith(".vvm") })
            if (vvms == null) {
                call.reject("Couldn't get vvms")
                Log.e("CorePlugin", "Couldn't get vvms")
                return
            }
            vvms.sortWith(compareBy {
                it.name.split(".")[0].toInt()
            })
            voiceModels = vvms.map {
                VoiceModel(it.absolutePath)
            }

            // Rustのtempfileクレートのための設定。
            // /data/local/tmp はAndroid 10から書き込めなくなった。そのため、
            // キャッシュディレクトリ内に一時フォルダを用意してそこから書き込むように設定する。
            val tempDir = File(activity.cacheDir.absolutePath + "/.tmp")
            tempDir.mkdirs()
            Os.setenv("TMPDIR", tempDir.absolutePath, true)

            Log.i("CorePlugin", "Ready")
            call.resolve()
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun loadModel(call: PluginCall) {
        val speakerId = call.getInt("speakerId")
        if (speakerId == null) {
            call.reject("Type mismatch")
            return
        }

        try {
            val model = getVoiceModelFromSpeakerId(speakerId)
            if (model == null) {
                call.reject("Unknown speaker id")
                return
            }
            synthesizer.loadVoiceModel(model)
            call.resolve()
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun isModelLoaded(call: PluginCall) {
        val speakerId = call.getInt("speakerId")
        if (speakerId == null) {
            call.reject("Type mismatch")
            return
        }

        try {
            val model = getVoiceModelFromSpeakerId(speakerId)
            if (model == null) {
                call.reject("Unknown speaker id")
                return
            }
            val result = synthesizer.isLoadedVoiceModel(model.id)
            val ret = JSObject()
            ret.put("value", result)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun audioQuery(call: PluginCall) {
        val text = call.getString("text")
        val speakerId = call.getInt("speakerId")
        if (text == null || speakerId == null) {
            call.reject("Type mismatch")
            return
        }

        try {
            val audioQuery = synthesizer.createAudioQuery(text, speakerId)
            val ret = JSObject()
            ret.put("value", gson.toJson(audioQuery))
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun accentPhrases(call: PluginCall) {
        val text = call.getString("text")
        val speakerId = call.getInt("speakerId")
        if (text == null || speakerId == null) {
            call.reject("Type mismatch")
            return
        }

        try {
            val accentPhrases = synthesizer.createAccentPhrases(text, speakerId)
            val ret = JSObject()
            ret.put("value", gson.toJson(accentPhrases))
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun moraPitch(call: PluginCall) {
        val accentPhrasesJson = call.getString("accentPhrases")
        val speakerId = call.getInt("speakerId")
        if (accentPhrasesJson == null || speakerId == null) {
            call.reject("Type mismatch")
            return
        }
        val accentPhrases =
            gson.fromJson(accentPhrasesJson, Array<AccentPhrase>::class.java).asList()

        try {
            val newAccentPhrases = synthesizer.replaceMoraPitch(accentPhrases, speakerId)
            val ret = JSObject()
            ret.put("value", gson.toJson(newAccentPhrases))
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun phonemeLength(call: PluginCall) {
        val accentPhrasesJson = call.getString("accentPhrases")
        val speakerId = call.getInt("speakerId")
        if (accentPhrasesJson == null || speakerId == null) {
            call.reject("Type mismatch")
            return
        }
        val accentPhrases =
            gson.fromJson(accentPhrasesJson, Array<AccentPhrase>::class.java).asList()

        try {
            val newAccentPhrases = synthesizer.replacePhonemeLength(accentPhrases, speakerId)
            val ret = JSObject()
            ret.put("value", gson.toJson(newAccentPhrases))
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun moraData(call: PluginCall) {
        val accentPhrasesJson = call.getString("accentPhrases")
        val speakerId = call.getInt("speakerId")
        if (accentPhrasesJson == null || speakerId == null) {
            call.reject("Type mismatch")
            return
        }
        val accentPhrases =
            gson.fromJson(accentPhrasesJson, Array<AccentPhrase>::class.java).asList()

        try {
            val newAccentPhrases = synthesizer.replaceMoraData(accentPhrases, speakerId)
            val ret = JSObject()
            ret.put("value", gson.toJson(newAccentPhrases))
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun synthesis(call: PluginCall) {
        val audioQueryJson = call.getString("audioQuery")
        val speakerId = call.getInt("speakerId")
        val enableInterrogativeUpspeak = call.getBoolean("enableInterrogativeUpspeak")
        if (audioQueryJson == null || speakerId == null || enableInterrogativeUpspeak == null) {
            call.reject("Type mismatch")
            return
        }

        val audioQuery = gson.fromJson(audioQueryJson, AudioQuery::class.java)

        try {
            val result = synthesizer.synthesis(audioQuery, speakerId)
                .interrogativeUpspeak(enableInterrogativeUpspeak).execute()
            val ret = JSObject()
            val encodedResult = Base64.getEncoder().encodeToString(result)
            ret.put("value", encodedResult)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun useUserDict(call: PluginCall) {
        val wordsJson = call.getString("wordsJson")
        if (wordsJson == null) {
            call.reject("Type mismatch")
            return
        }

        try {
            val words = gson.fromJson(wordsJson, Array<UserDict.Word>::class.java).asList()
            if (words.isEmpty()) {
                call.resolve()
                return
            }
            val userDict = UserDict()
            words.forEach { word ->
                userDict.addWord(word)
            }
            openJtalk.useUserDict(userDict)
            call.resolve()
        } catch (e: Exception) {
            call.reject(e.message)
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
            destRoot.deleteRecursively()
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

    private fun getVoiceModelFromSpeakerId(speakerId: Int): VoiceModel? {
        return voiceModels.find { model ->
            model.metas.any { meta ->
                meta.styles.any { style ->
                    style.id == speakerId
                }
            }
        }
    }
}
