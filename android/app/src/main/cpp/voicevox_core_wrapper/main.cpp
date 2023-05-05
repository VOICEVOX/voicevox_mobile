#include <jni.h>
#include <dlfcn.h>
#include <android/log.h>
#include <string>
#include "core_caller.cpp"

#define LOG_TAG "voicevox_core_wrapper"

VoicevoxCore *voicevoxCore;

bool assertCoreLoaded(JNIEnv *env) {
    if (!voicevoxCore) {
        jclass jExceptionClass = env->FindClass("java/lang/RuntimeException");
        env->ThrowNew(jExceptionClass, "voicevoxCore is not loaded");
        return false;
    }
    return true;
}


extern "C"
JNIEXPORT void JNICALL
Java_jp_hiroshiba_voicevox_VoicevoxCore_loadLibrary(JNIEnv *env, jobject thiz) {
    __android_log_print(ANDROID_LOG_INFO, LOG_TAG, "loadLibrary");
    voicevoxCore = new VoicevoxCore();

    if (!voicevoxCore) {
        jclass jExceptionClass = env->FindClass("java/lang/RuntimeException");
        auto error = std::string(dlerror());
        env->ThrowNew(jExceptionClass, (std::string("loadLibrary failed: ") + error).c_str());
        return;
    }
    __android_log_print(ANDROID_LOG_INFO, LOG_TAG, "loadLibrary success");
}

extern "C"
JNIEXPORT jstring
Java_jp_hiroshiba_voicevox_VoicevoxCore_voicevoxGetSupportedDevicesJson(
        JNIEnv *env,
        jobject thiz
) {
    if (!assertCoreLoaded(env)) {
        return nullptr;
    }

    return env->
            NewStringUTF(voicevoxCore->voicevox_get_supported_devices_json());
}

extern "C"
JNIEXPORT jstring
Java_jp_hiroshiba_voicevox_VoicevoxCore_voicevoxGetVersion(
        JNIEnv *env,
        jobject thiz
) {
    if (!assertCoreLoaded(env)) {
        return nullptr;
    }

    return env->
            NewStringUTF(voicevoxCore->voicevox_get_version());
}

extern "C"
JNIEXPORT jstring
Java_jp_hiroshiba_voicevox_VoicevoxCore_voicevoxGetMetasJson(
        JNIEnv *env,
        jobject thiz
) {
    if (!assertCoreLoaded(env)) {
        return nullptr;
    }

    return env->
            NewStringUTF(voicevoxCore->voicevox_get_metas_json());
}
