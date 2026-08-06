import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, Search, Waves, X } from "lucide-react";
import { searchCourses } from "../../../../../../features/course/infrastructure/api/SearchApi";
import "../dropdown/VoiceSearch.css";

const HeaderSearch = ({ variant = "logged" }) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const navigate = useNavigate();

  const prefix = variant === "guest" ? "header-search" : "user-logged-search";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (!debouncedTerm) {
      setResults([]);
      return;
    }

    let cancelled = false;
    searchCourses(debouncedTerm)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedTerm]);

  const goToCourse = (courseId) => {
    setIsFocused(false);
    setSearchTerm("");
    navigate(`/learnova/courses/detail/${courseId}`);
  };

  const playToggleSound = (starting) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = audioContextRef.current || new AudioContext();
    audioContextRef.current = context;
    const now = context.currentTime;

    const notes = starting ? [660, 880] : [520, 360];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const offset = index * 0.08;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.08, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.14);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.16);
    });
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const armSilenceTimer = (recognition) => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      recognition.stop();
      setIsListening(false);
      setVoiceText(t("header.voiceSearchSilence"));
      playToggleSound(false);
    }, 5500);
  };

  const closeVoiceSearch = () => {
    clearSilenceTimer();
    if (isListening) playToggleSound(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setIsVoiceOpen(false);
    setVoiceText("");
  };

  const stopListening = () => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceText(t("header.voiceSearchPaused"));
    playToggleSound(false);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsVoiceOpen(true);
      setVoiceText(t("header.voiceSearchUnsupported"));
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsVoiceOpen(true);
      setIsListening(true);
      setVoiceText("");
      playToggleSound(true);
      armSilenceTimer(recognition);
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join("")
        .trim();
      setVoiceText(transcript);
      armSilenceTimer(recognition);

      if (event.results[event.results.length - 1].isFinal && transcript) {
        clearSilenceTimer();
        setIsListening(false);
        playToggleSound(false);
        window.setTimeout(() => {
          setIsVoiceOpen(false);
          navigate(`/learnova/courses?voiceQuery=${encodeURIComponent(transcript)}`);
        }, 500);
      }
    };
    recognition.onerror = () => {
      clearSilenceTimer();
      setIsListening(false);
      setVoiceText(t("header.voiceSearchTryAgain"));
    };
    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setIsVoiceOpen(true);
    recognition.start();
  };

  useEffect(() => () => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    audioContextRef.current?.close?.();
  }, []);

  return (
    <form className={prefix} role="search" onSubmit={(e) => e.preventDefault()}>
      <Search size={18} className={`${prefix}-icon`} />
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        placeholder={t("header.searchCourseInstructorCategory")}
        className={`${prefix}-input`}
        aria-label={t("header.searchCourseInstructorCategory")}
      />
      <button
        type="button"
        className={`${prefix}-voice-button`}
        onClick={startVoiceSearch}
        aria-label={t("header.voiceSearch")}
        title={t("header.voiceSearch")}
      >
        <Mic size={18} />
      </button>

      {isFocused && results.length > 0 && (
        <div className={`${prefix}-suggestions`}>
          {results.map((course) => (
            <button
              key={course.courseId}
              type="button"
              className={`${prefix}-suggestion`}
              onMouseDown={() => goToCourse(course.courseId)}
            >
              <Search size={15} />
              <span
                dangerouslySetInnerHTML={{
                  __html: course.titleHighlight || course.title,
                }}
              />
              <small>{course.categoryName || course.instructorName}</small>
            </button>
          ))}
        </div>
      )}

      {isVoiceOpen && (
        <div className="voice-search-modal-overlay" role="presentation" onMouseDown={closeVoiceSearch}>
          <section className="voice-search-modal" role="dialog" aria-modal="true" aria-labelledby="voice-search-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="voice-search-close" onClick={closeVoiceSearch} aria-label={t("header.closeVoiceSearch")}>
              <X size={22} />
            </button>
            <div className="voice-search-modal-icon"><Waves size={24} /></div>
            <h2 id="voice-search-title">{isListening ? t("header.voiceSearchListening") : t("header.voiceSearchDone")}</h2>
            <p>{isListening ? t("header.voiceSearchHint") : t("header.voiceSearchProcessing")}</p>
            <div className={`voice-search-visualizer ${isListening ? "is-active" : ""}`} aria-hidden="true">
              {[1, 2, 3, 4, 5].map((bar) => <span key={bar} />)}
            </div>
            <div className="voice-search-transcript">{voiceText || t("header.voiceSearchSpeakNow")}</div>
            <button type="button" className={`voice-search-mic ${isListening ? "is-listening" : ""}`} onClick={isListening ? stopListening : startVoiceSearch}>
              {isListening ? <MicOff size={30} /> : <Mic size={30} />}
            </button>
            <small>{isListening ? t("header.voiceSearchStop") : t("header.voiceSearchStart")}</small>
          </section>
        </div>
      )}
    </form>
  );
};

export default HeaderSearch;
