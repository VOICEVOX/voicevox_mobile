import { ApiProvider } from ".";
import {
  AccentPhraseFromJSON,
  AccentPhraseToJSON,
  AudioQueryFromJSON,
} from "@/openapi";

const queryProvider: ApiProvider = ({ corePlugin }) => {
  return {
    async audioQueryAudioQueryPost({ text, speaker: speakerId }) {
      const rawQuery = await corePlugin
        .audioQuery({ text, speakerId })
        .then((res) => JSON.parse(res.value));
      return AudioQueryFromJSON({
        accent_phrases: rawQuery.accent_phrases,
        speedScale: rawQuery.speed_scale,
        pitchScale: rawQuery.pitch_scale,
        intonationScale: rawQuery.intonation_scale,
        volumeScale: rawQuery.volume_scale,
        prePhonemeLength: rawQuery.pre_phoneme_length,
        postPhonemeLength: rawQuery.post_phoneme_length,
        outputSamplingRate: rawQuery.output_sampling_rate,
        outputStereo: rawQuery.output_stereo,
        kana: rawQuery.kana,
      });
    },

    async accentPhrasesAccentPhrasesPost({ text, speaker: speakerId }) {
      const rawAccentPhrases = await corePlugin
        .accentPhrases({ text, speakerId })
        .then((res) => JSON.parse(res.value));
      return rawAccentPhrases.map(AccentPhraseFromJSON);
    },

    async moraLengthMoraLengthPost({
      accentPhrase: accentPhrases,
      speaker: speakerId,
    }) {
      const rawMoraLength = await corePlugin
        .phonemeLength({
          accentPhrases: JSON.stringify(accentPhrases.map(AccentPhraseToJSON)),
          speakerId,
        })
        .then((res) => JSON.parse(res.value));
      return rawMoraLength.map(AccentPhraseFromJSON);
    },

    async moraPitchMoraPitchPost({
      accentPhrase: accentPhrases,
      speaker: speakerId,
    }) {
      const rawMoraPitch = await corePlugin
        .moraPitch({
          accentPhrases: JSON.stringify(accentPhrases.map(AccentPhraseToJSON)),
          speakerId,
        })
        .then((res) => JSON.parse(res.value));
      return rawMoraPitch.map(AccentPhraseFromJSON);
    },

    async moraDataMoraDataPost({
      accentPhrase: accentPhrases,
      speaker: speakerId,
    }) {
      const rawMoraData = await corePlugin
        .moraData({
          accentPhrases: JSON.stringify(accentPhrases.map(AccentPhraseToJSON)),
          speakerId,
        })
        .then((res) => JSON.parse(res.value));
      return rawMoraData.map(AccentPhraseFromJSON);
    },

    async synthesisSynthesisPost({
      audioQuery,
      speaker: speakerId,
      enableInterrogativeUpspeak,
    }) {
      const b64Audio = await corePlugin
        .synthesis({
          audioQuery: JSON.stringify({
            accent_phrases: audioQuery.accentPhrases.map(AccentPhraseToJSON),
            speed_scale: audioQuery.speedScale,
            pitch_scale: audioQuery.pitchScale,
            intonation_scale: audioQuery.intonationScale,
            volume_scale: audioQuery.volumeScale,
            pre_phoneme_length: audioQuery.prePhonemeLength,
            post_phoneme_length: audioQuery.postPhonemeLength,
            output_sampling_rate: audioQuery.outputSamplingRate,
            output_stereo: audioQuery.outputStereo,
            kana: audioQuery.kana,
          }),
          speakerId,
          enableInterrogativeUpspeak: !!enableInterrogativeUpspeak,
        })
        .then((res) => {
          return atob(res.value);
        });

      const arrayBuffer = Uint8Array.from(
        b64Audio.split("").map((c) => c.charCodeAt(0))
      ).buffer;

      return new Blob([arrayBuffer], { type: "audio/wav" });
    },
  };
};

export default queryProvider;
