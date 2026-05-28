import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Globe,
  Hash,
  Layers,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sliders,
  Trash2,
  Unlink,
  Users,
  X,
  Youtube,
} from 'lucide-react';
import { api } from '../lib/shared.jsx';
import '../styles/settings.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, tone = 'green') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function Toasts({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="stToasts">
      {toasts.map((t) => (
        <div key={t.id} className={`stToast stToast--${t.tone}`}>{t.message}</div>
      ))}
    </div>
  );
}

// ─── Reusable tag editor ──────────────────────────────────────────────────────

function TagList({ items, onRemove, onAdd, placeholder = 'Додати…', compact = false }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  function commit() {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft('');
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Backspace' && !draft && items.length) onRemove(items[items.length - 1]);
  }

  return (
    <div className={`stTagList ${compact ? 'stTagList--compact' : ''}`}>
      <div className="stTags">
        {items.map((item) => (
          <span key={item} className="stTag">
            {item}
            <button type="button" className="stTagRemove" onClick={() => onRemove(item)} aria-label={`Видалити ${item}`}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="stTagInput"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={items.length === 0 ? placeholder : ''}
        />
      </div>
    </div>
  );
}

function addToList(list, value) {
  const trimmed = value.trim();
  if (!trimmed || list.includes(trimmed)) return list;
  return [...list, trimmed];
}
function removeFromList(list, value) {
  return list.filter((x) => x !== value);
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children, onSave, saving, saved }) {
  return (
    <div className="stSection">
      <div className="stSectionHead">
        <div>
          <h2 className="stSectionTitle">{title}</h2>
          {description && <p className="stSectionDesc">{description}</p>}
        </div>
        <button
          className={`stSaveBtn ${saved ? 'stSaveBtn--saved' : ''}`}
          type="button"
          onClick={onSave}
          disabled={saving}
        >
          <Save size={14} />
          {saving ? 'Збереження…' : saved ? 'Збережено' : 'Зберегти'}
        </button>
      </div>
      <div className="stSectionBody">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="stField">
      <label className="stLabel">{label}{hint && <span className="stHint">{hint}</span>}</label>
      {children}
    </div>
  );
}

// ─── YouTube keyword helpers ──────────────────────────────────────────────────

function kwToTags(str) {
  if (!str) return [];
  if (str.includes(',')) return str.split(',').map((s) => s.trim()).filter(Boolean);
  const tags = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m;
  while ((m = re.exec(str)) !== null) tags.push((m[1] || m[2]).trim());
  return tags.filter(Boolean);
}

function tagsToKw(tags) {
  return tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.includes(' ') ? `"${t}"` : t))
    .join(' ');
}

// ─── Format / analytics helpers ──────────────────────────────────────────────

const FORMAT_SUGGESTIONS = [
  'experiment_with_result',
  'local_vs_cloud_comparison',
  'budget_alternative',
  'build_in_public',
  'myth_test',
  'tutorial_step_by_step',
  'deep_dive_review',
];

const COUNTRIES = [
  { code: '', label: '— не вказано —' },
  { code: 'UA', label: 'Україна' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Deutschland' },
  { code: 'FR', label: 'France' },
  { code: 'PL', label: 'Polska' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'SE', label: 'Sweden' },
  { code: 'NO', label: 'Norway' },
  { code: 'FI', label: 'Finland' },
  { code: 'DK', label: 'Denmark' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'AT', label: 'Austria' },
  { code: 'CZ', label: 'Czech Republic' },
  { code: 'SK', label: 'Slovakia' },
  { code: 'RO', label: 'Romania' },
  { code: 'TR', label: 'Turkey' },
  { code: 'BR', label: 'Brasil' },
  { code: 'IN', label: 'India' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'Korea' },
];

function fmtNum(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
function fmtCtr(f) {
  if (!f && f !== 0) return '—';
  return (f * 100).toFixed(2) + '%';
}
function fmtAvd(s) {
  if (!s && s !== 0) return '—';
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}
function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

// ─── Tab: YouTube канал (merged Канал + YouTube) ──────────────────────────────

function YouTubeChannelTab({ data, onChange, toast }) {
  const ch = data.channel;
  const dec = data.decision;

  // YouTube connection state
  const [ytStatus, setYtStatus] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);
  const pollTimerRef = useRef(null);
  const refreshPollRef = useRef(null);

  // YouTube-only draft fields (not backed by YAML)
  const [countryDraft, setCountryDraft] = useState('');
  const [trailerDraft, setTrailerDraft] = useState('');

  // Save state for profile section
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // Save state for SEO section
  const [savingSeo, setSavingSeo] = useState(false);
  const [savedSeo, setSavedSeo] = useState(false);

  // Analytics
  const [analyticsData, setAnalyticsData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  function setChannel(key, value) {
    onChange({ ...data, channel: { ...ch, [key]: value } });
  }
  function setDecision(key, value) {
    onChange({ ...data, decision: { ...dec, [key]: value } });
  }

  function stopPoll() {
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
  }

  async function fetchStatus() {
    try {
      const s = await api('/api/youtube/status');
      setYtStatus(s);
      if (s.auth_url) setAuthUrl(s.auth_url);
      if (s.status === 'connected' && s.channel) {
        setCountryDraft(s.channel.country || '');
        setTrailerDraft(
          s.channel.trailer_video_id
            ? `https://www.youtube.com/watch?v=${s.channel.trailer_video_id}`
            : ''
        );
        setAuthUrl(null);
        loadAnalytics();
      }
      if (s.status === 'pending') {
        pollTimerRef.current = setTimeout(fetchStatus, 3000);
      } else {
        stopPoll();
        if (s.status !== 'pending') setAuthUrl(null);
      }
    } catch { /* ignore fetch errors during polling */ }
  }

  async function loadAnalytics() {
    try {
      const d = await api('/api/youtube/analytics?limit=30');
      setAnalyticsData(d);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchStatus();
    return () => stopPoll();
  }, []);

  async function handleConnect() {
    try {
      const res = await api('/api/youtube/auth-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (res.ok && res.auth_url) {
        setAuthUrl(res.auth_url);
        setYtStatus((prev) => ({ ...prev, status: 'pending' }));
        pollTimerRef.current = setTimeout(fetchStatus, 3000);
      } else {
        toast(res.error || 'Помилка запуску авторизації', 'red');
      }
    } catch (err) { toast(String(err), 'red'); }
  }

  async function handleDisconnect() {
    try {
      await api('/api/youtube/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      setYtStatus({ status: 'disconnected', error: null, channel: null });
      setAuthUrl(null);
      setAnalyticsData(null);
      setCountryDraft('');
      setTrailerDraft('');
      toast('Канал відключено', 'green');
    } catch (err) { toast(String(err), 'red'); }
  }

  async function handleSaveProfile() {
    setSavingProfile(true); setSavedProfile(false);
    try {
      await api('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: data.channel }),
      });
      toast('Профіль збережено', 'green');
      setSavedProfile(true); setTimeout(() => setSavedProfile(false), 2500);
    } catch (err) { toast(`Помилка: ${err.message || err}`, 'red'); }
    finally { setSavingProfile(false); }
  }

  async function handleSaveSeo() {
    setSavingSeo(true); setSavedSeo(false);
    try {
      // Save both channel (youtube_description) and decision (keywords) to YAML
      await api('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: data.channel, decision: data.decision }),
      });
      if (ytStatus?.status === 'connected') {
        // Sync YouTube description (not LLM context) + keywords + country + trailer to YouTube API
        await api('/api/youtube/update-channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: data.channel.youtube_description || '',
            keywords: tagsToKw(data.decision.channel_keywords || []),
            country: countryDraft,
            trailer_url: trailerDraft,
          }),
        });
        toast('SEO збережено та синхронізовано з YouTube', 'green');
      } else {
        toast('SEO налаштування збережено', 'green');
      }
      setSavedSeo(true); setTimeout(() => setSavedSeo(false), 2500);
    } catch (err) { toast(`Помилка: ${err.message || err}`, 'red'); }
    finally { setSavingSeo(false); }
  }

  async function handleRefreshAnalytics() {
    setRefreshing(true);
    const prevRefreshed = analyticsData?.last_refreshed || null;
    try {
      await api('/api/youtube/refresh-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30 }),
      });
      let attempts = 0;
      function pollAnalytics() {
        refreshPollRef.current = setTimeout(async () => {
          try {
            const d = await api('/api/youtube/analytics?limit=30');
            setAnalyticsData(d);
            if (d.last_refreshed !== prevRefreshed || attempts > 20) {
              setRefreshing(false);
            } else {
              attempts++;
              pollAnalytics();
            }
          } catch { setRefreshing(false); }
        }, 4000);
      }
      pollAnalytics();
    } catch (err) { toast(String(err), 'red'); setRefreshing(false); }
  }

  async function handleCopyUrl() {
    const url = authUrl || ytStatus?.auth_url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast('Посилання скопійовано', 'green');
    } catch { toast('Не вдалося скопіювати', 'red'); }
  }

  async function handleCancelAuth() {
    stopPoll();
    setAuthUrl(null);
    await api('/api/youtube/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
    setYtStatus({ status: 'disconnected', error: null, channel: null, auth_url: null });
  }

  const connected = ytStatus?.status === 'connected';
  const pending = ytStatus?.status === 'pending';
  const hasError = ytStatus?.status === 'error';
  const displayUrl = authUrl || ytStatus?.auth_url;

  return (
    <div className="stYouTubeTab">

      {/* ── Connection card ── */}
      <div className={`ytConnectCard ${connected ? 'ytStatus--connected' : pending ? 'ytStatus--pending' : hasError ? 'ytStatus--error' : ''}`}>
        <div className="ytConnectCardHead">
          <Youtube size={18} className="ytIcon" />
          <h2 className="stSectionTitle" style={{ margin: 0 }}>YouTube канал</h2>
        </div>

        {ytStatus === null && <p className="ytEmpty">Завантаження статусу…</p>}

        {ytStatus !== null && ytStatus.status === 'disconnected' && (
          <div className="ytDisconnectedState">
            <p className="ytAuthInstruction">Підключіть свій YouTube канал для синхронізації налаштувань та отримання аналітики власних відео.</p>
            <button className="ytConnectBtn" type="button" onClick={handleConnect}>
              <Link2 size={15} /> Підключити YouTube канал
            </button>
          </div>
        )}

        {pending && (
          <div className="ytAuthBox">
            {displayUrl ? (
              <>
                <p className="ytAuthInstruction">Відкрийте посилання у браузері та надайте доступ до свого каналу:</p>
                <div className="ytAuthUrl">
                  <code>{displayUrl}</code>
                  <button type="button" className="ytAuthCopyBtn" onClick={handleCopyUrl}>
                    <Copy size={12} /> Копіювати
                  </button>
                </div>
              </>
            ) : (
              <p className="ytAuthInstruction">Авторизацію розпочато. Якщо браузер не відкрився — спробуйте ще раз.</p>
            )}
            <div className="ytAuthActions">
              <span className="ytPollingDot" />
              <span className="ytAuthNote">Очікування авторизації…</span>
              <button type="button" className="ytAuthCopyBtn" onClick={handleConnect} style={{ borderColor: 'var(--muted)', color: 'var(--muted)' }}>
                <RefreshCw size={12} /> Нове посилання
              </button>
              <button type="button" className="ytCancelBtn" onClick={handleCancelAuth}>Скасувати</button>
            </div>
          </div>
        )}

        {connected && ytStatus.channel && (
          <div className="ytChannelProfile">
            {ytStatus.channel.thumbnail_url && (
              <img className="ytChannelThumb" src={ytStatus.channel.thumbnail_url} alt={ytStatus.channel.title} />
            )}
            <div className="ytChannelInfo">
              <p className="ytChannelName">{ytStatus.channel.title}</p>
              <div className="ytChannelMeta">
                {ytStatus.channel.custom_url && <span>{ytStatus.channel.custom_url}</span>}
                <span>{fmtNum(ytStatus.channel.subscribers)} підписників</span>
                <span>{fmtNum(ytStatus.channel.video_count)} відео</span>
              </div>
            </div>
            <button type="button" className="ytDisconnectBtn" onClick={handleDisconnect}>
              <Unlink size={13} /> Відключити
            </button>
          </div>
        )}

        {hasError && (
          <div className="ytErrorState">
            <p className="ytErrorMsg">{ytStatus.error || 'Помилка підключення'}</p>
            <button className="ytConnectBtn" type="button" onClick={handleConnect}>
              <Link2 size={15} /> Спробувати знову
            </button>
          </div>
        )}
      </div>

      {/* ── Profile section ── */}
      <Section
        title="Профіль каналу"
        description="Ці дані використовуються для LLM-рекомендацій та скорингу. Опис каналу синхронізується з YouTube при збереженні."
        onSave={handleSaveProfile}
        saving={savingProfile}
        saved={savedProfile}
      >
        <div className="stGrid2">
          <Field label="Назва каналу">
            <input
              className="stInput"
              value={ch.name}
              onChange={(e) => setChannel('name', e.target.value)}
              placeholder="Наприклад: ШтучнийГліб"
            />
          </Field>
          <Field label="Мова контенту">
            <select className="stSelect" value={ch.language} onChange={(e) => setChannel('language', e.target.value)}>
              <option value="uk">🇺🇦 Українська (uk)</option>
              <option value="en">🇬🇧 English (en)</option>
              <option value="ru">ru</option>
            </select>
          </Field>
          <Field label="Підписники" hint="приблизно">
            <input
              className="stInput"
              type="number"
              min="0"
              value={ch.subscribers}
              onChange={(e) => setChannel('subscribers', Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <Field label="Контекст для аналізу (LLM)" hint="детальний внутрішній контекст — тільки для рекомендацій">
          <textarea
            className="stTextarea"
            rows={4}
            value={ch.description}
            onChange={(e) => setChannel('description', e.target.value)}
            placeholder="Практичний канал про локальний AI, автоматизацію, DIY-залізо…  Тут можна описати стратегію, позиціонування, що відрізняє канал від конкурентів тощо."
          />
        </Field>

        <Field label="Цільова аудиторія">
          <textarea
            className="stTextarea"
            rows={3}
            value={ch.target_audience}
            onChange={(e) => setChannel('target_audience', e.target.value)}
            placeholder="Розробники і tech-ентузіасти, які хочуть…"
          />
        </Field>

        <Field label="Нотатки про контент" hint="стиль і формат">
          <textarea
            className="stTextarea"
            rows={3}
            value={ch.content_notes}
            onChange={(e) => setChannel('content_notes', e.target.value)}
            placeholder="Глядач має чітко розуміти: що автор пробує…"
          />
        </Field>

        <Field label="Сильні формати" hint="Enter для додавання">
          <div className="stSuggestions">
            {FORMAT_SUGGESTIONS.filter((s) => !ch.format_strengths.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                className="stSuggestionChip"
                onClick={() => setChannel('format_strengths', addToList(ch.format_strengths, s))}
              >
                <Plus size={11} />{s}
              </button>
            ))}
          </div>
          <TagList
            items={ch.format_strengths}
            onAdd={(v) => setChannel('format_strengths', addToList(ch.format_strengths, v))}
            onRemove={(v) => setChannel('format_strengths', removeFromList(ch.format_strengths, v))}
            placeholder="experiment_with_result"
          />
        </Field>

        <Field label="Топ відео (past hits)" hint="для калібрування рекомендацій">
          <TagList
            items={ch.past_hits}
            onAdd={(v) => setChannel('past_hits', addToList(ch.past_hits, v))}
            onRemove={(v) => setChannel('past_hits', removeFromList(ch.past_hits, v))}
            placeholder="Назва відео, яке добре зайшло…"
          />
        </Field>
      </Section>

      {/* ── SEO & keywords section ── */}
      <Section
        title="YouTube SEO та ключові слова"
        description={connected
          ? 'Ключові слова впливають на channel_fit score та синхронізуються з YouTube при збереженні. Країна і трейлер зберігаються тільки на YouTube.'
          : 'Ключові слова впливають на channel_fit score. Підключіть YouTube для синхронізації та керування країною і трейлером.'
        }
        onSave={handleSaveSeo}
        saving={savingSeo}
        saved={savedSeo}
      >
        <Field label="Опис каналу (YouTube)" hint="публічний опис · до 1 000 символів · синхронізується з YouTube при збереженні">
          <textarea
            className="stTextarea"
            rows={5}
            value={ch.youtube_description || ''}
            onChange={(e) => setChannel('youtube_description', e.target.value)}
            maxLength={1000}
            placeholder="Короткий публічний опис, що відображається на сторінці каналу…"
          />
          <div className="ytCharCount">{(ch.youtube_description || '').length} / 1000</div>
        </Field>

        <Field label="Ключові слова каналу" hint="впливають на channel_fit score · синхронізуються з YouTube при збереженні">
          <p className="stFieldNote">
            Сигнали, чиї заголовки/теги містять більше цих слів, отримують вищий channel_fit score.
          </p>
          <TagList
            items={dec.channel_keywords}
            onAdd={(v) => setDecision('channel_keywords', addToList(dec.channel_keywords, v))}
            onRemove={(v) => setDecision('channel_keywords', removeFromList(dec.channel_keywords, v))}
            placeholder="ai, ollama, automation…"
            compact
          />
        </Field>

        {connected && (
          <div className="stGrid2">
            <Field label="Країна каналу" hint="ISO 3166-1 · впливає на регіональні рекомендації YouTube">
              <select
                className="stSelect"
                value={countryDraft}
                onChange={(e) => setCountryDraft(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {connected && (
          <Field
            label="Трейлер каналу"
            hint="URL або ID відео — показується незареєстрованим відвідувачам"
          >
            <input
              className="stInput"
              value={trailerDraft}
              onChange={(e) => setTrailerDraft(e.target.value)}
              placeholder="https://youtube.com/watch?v=… або відео-ID"
            />
            {trailerDraft && (
              <a
                className="ytTrailerLink"
                href={trailerDraft.startsWith('http') ? trailerDraft : `https://www.youtube.com/watch?v=${trailerDraft}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={12} /> Переглянути відео
              </a>
            )}
          </Field>
        )}
      </Section>

      {/* ── Analytics ── */}
      {connected && (
        <div className="stSection">
          <div className="stSectionHead">
            <div>
              <h2 className="stSectionTitle">Аналітика власних відео</h2>
              {analyticsData?.last_refreshed
                ? <p className="stSectionDesc">Оновлено: {fmtDate(analyticsData.last_refreshed)} · {analyticsData.total_videos} відео</p>
                : <p className="stSectionDesc">Немає кешованих даних — натисніть «Оновити»</p>
              }
            </div>
            <button
              type="button"
              className="ytRefreshBtn"
              onClick={handleRefreshAnalytics}
              disabled={refreshing}
            >
              <RefreshCw size={13} className={refreshing ? 'ytSpinIcon' : ''} />
              {refreshing ? 'Завантаження…' : 'Оновити'}
            </button>
          </div>

          <div className="stSectionBody">
            {(!analyticsData || !analyticsData.videos?.length) ? (
              <div className="ytEmpty">
                {refreshing ? 'Отримання даних з YouTube Analytics API…' : 'Немає даних. Натисніть «Оновити» для завантаження.'}
              </div>
            ) : (
              <div className="ytVideoTable">
                <div className="ytVideoHead">
                  <span>Відео</span>
                  <span>Дата</span>
                  <span>Перегляди</span>
                  <span>CTR</span>
                  <span>AVD</span>
                </div>
                {analyticsData.videos.map((v) => (
                  <div key={v.video_id} className="ytVideoRow">
                    <a href={v.url} className="ytVideoTitle" target="_blank" rel="noreferrer">
                      {v.title || v.video_id}
                      <ExternalLink size={11} className="ytExtIcon" />
                    </a>
                    <span className="ytVideoDate">{fmtDate(v.published_at)}</span>
                    <span className="ytVideoNum">{fmtNum(v.views)}</span>
                    <span className="ytVideoNum">{fmtCtr(v.ctr)}</span>
                    <span className="ytVideoNum">{fmtAvd(v.avg_view_duration_seconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Теми і ключові слова ────────────────────────────────────────────────

function TopicsTab({ data, onChange, onSave, saving, saved }) {
  const ch = data.channel;
  const dec = data.decision;

  function setChannel(key, value) {
    onChange({ ...data, channel: { ...ch, [key]: value } });
  }
  function setDecision(key, value) {
    onChange({ ...data, decision: { ...dec, [key]: value } });
  }

  return (
    <Section
      title="Теми і ключові слова"
      description="Визначають фокус збору даних, фільтрацію сигналів і оцінку відповідності теми каналу."
      onSave={onSave}
      saving={saving}
      saved={saved}
    >
      <Field
        label="Фокусні теми"
        hint="теми, які точно підходять"
      >
        <TagList
          items={ch.focus_topics}
          onAdd={(v) => setChannel('focus_topics', addToList(ch.focus_topics, v))}
          onRemove={(v) => setChannel('focus_topics', removeFromList(ch.focus_topics, v))}
          placeholder="local AI, automation workflows…"
        />
      </Field>

      <Field
        label="Теми для уникнення"
        hint="будуть знижені в рекомендаціях"
      >
        <TagList
          items={ch.avoid_topics}
          onAdd={(v) => setChannel('avoid_topics', addToList(ch.avoid_topics, v))}
          onRemove={(v) => setChannel('avoid_topics', removeFromList(ch.avoid_topics, v))}
          placeholder="gaming, politics…"
        />
      </Field>

      <Field label="YouTube категорії ніші" hint="ID категорій для фільтрації mostPopular">
        <p className="stFieldNote">
          Сигнали «mostPopular» поза цими категоріями відфільтровуються. Конкурентні та глобальні треки завжди проходять.
        </p>
        <div className="stCategoryGrid">
          {YOUTUBE_CATEGORIES.map(({ id, name }) => {
            const active = dec.niche_category_ids.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`stCategoryChip ${active ? 'stCategoryChip--active' : ''}`}
                onClick={() => {
                  const next = active
                    ? dec.niche_category_ids.filter((x) => x !== id)
                    : [...dec.niche_category_ids, id];
                  setDecision('niche_category_ids', next);
                }}
              >
                <span className="stCategoryId">{id || '—'}</span>
                {name}
              </button>
            );
          })}
        </div>
      </Field>
    </Section>
  );
}

const YOUTUBE_CATEGORIES = [
  { id: '1', name: 'Film & Animation' },
  { id: '2', name: 'Autos & Vehicles' },
  { id: '10', name: 'Music' },
  { id: '15', name: 'Pets & Animals' },
  { id: '17', name: 'Sports' },
  { id: '19', name: 'Travel & Events' },
  { id: '20', name: 'Gaming' },
  { id: '21', name: 'Videoblogging' },
  { id: '22', name: 'People & Blogs' },
  { id: '23', name: 'Comedy' },
  { id: '24', name: 'Entertainment' },
  { id: '25', name: 'News & Politics' },
  { id: '26', name: 'Howto & Style' },
  { id: '27', name: 'Education' },
  { id: '28', name: 'Science & Technology' },
  { id: '29', name: 'Nonprofits & Activism' },
  { id: '', name: 'Unknown / unclassified' },
];

// ─── Tab: Конкуренти ──────────────────────────────────────────────────────────

const EMPTY_COMPETITOR = { channel_id: '', title: '', handle: '', market: 'global', focus: '' };

function CompetitorRow({ channel, onChange, onRemove }) {
  function set(key, value) { onChange({ ...channel, [key]: value }); }
  return (
    <div className="stCompetitorRow">
      <div className="stCompetitorMain">
        <input
          className="stInput stInput--mono"
          value={channel.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Назва каналу"
        />
        <input
          className="stInput"
          value={channel.handle}
          onChange={(e) => set('handle', e.target.value)}
          placeholder="@handle"
        />
        <select className="stSelect stSelect--sm" value={channel.market} onChange={(e) => set('market', e.target.value)}>
          <option value="global">🌐 Global</option>
          <option value="ua">🇺🇦 UA</option>
          <option value="ru">RU</option>
        </select>
      </div>
      <div className="stCompetitorSub">
        <input
          className="stInput stInput--mono stInput--sm"
          value={channel.channel_id}
          onChange={(e) => set('channel_id', e.target.value)}
          placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx  (channel_id)"
        />
        <input
          className="stInput stInput--grow"
          value={channel.focus}
          onChange={(e) => set('focus', e.target.value)}
          placeholder="Фокус / опис (наприклад: local AI, DIY hardware)"
        />
        <button type="button" className="stIconBtn stIconBtn--danger" onClick={onRemove} aria-label="Видалити">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function CompetitorsTab({ data, onChange, onSave, saving, saved }) {
  const competitors = data.competitors;
  const [filter, setFilter] = useState('all');

  function setCompetitors(next) {
    onChange({ ...data, competitors: next });
  }

  function updateAt(index, value) {
    const next = competitors.map((c, i) => (i === index ? value : c));
    setCompetitors(next);
  }

  function removeAt(index) {
    setCompetitors(competitors.filter((_, i) => i !== index));
  }

  function addNew() {
    setCompetitors([...competitors, { ...EMPTY_COMPETITOR }]);
  }

  const filtered = filter === 'all' ? competitors : competitors.filter((c) => c.market === filter);
  const counts = {
    all: competitors.length,
    global: competitors.filter((c) => c.market === 'global').length,
    ua: competitors.filter((c) => c.market === 'ua').length,
  };

  return (
    <Section
      title="Канали конкурентів"
      description="RSS-моніторинг нових відео без витрат квоти API. Нові відео збагачуються через videos.list (~1–4 одиниці квоти на запуск)."
      onSave={onSave}
      saving={saving}
      saved={saved}
    >
      <div className="stCompetitorToolbar">
        <div className="stFilterTabs">
          {[['all', 'Всі', counts.all], ['global', '🌐 Global', counts.global], ['ua', '🇺🇦 UA', counts.ua]].map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              className={`stFilterTab ${filter === key ? 'stFilterTab--active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label} <span className="stFilterCount">{count}</span>
            </button>
          ))}
        </div>
        <button type="button" className="stAddBtn" onClick={addNew}>
          <Plus size={15} />Додати канал
        </button>
      </div>

      <div className="stCompetitorList">
        {filtered.length === 0 && (
          <div className="stEmpty">Немає каналів у цьому фільтрі.</div>
        )}
        {competitors.map((channel, globalIndex) => {
          if (filter !== 'all' && channel.market !== filter) return null;
          return (
            <CompetitorRow
              key={globalIndex}
              channel={channel}
              onChange={(v) => updateAt(globalIndex, v)}
              onRemove={() => removeAt(globalIndex)}
            />
          );
        })}
      </div>

      <div className="stCompetitorHint">
        <strong>channel_id</strong> можна знайти у URL каналу:{' '}
        <code>youtube.com/channel/UCxxxxxxxx</code>. Для @handle — через{' '}
        <code>youtube.com/@handle/about</code> → перевірте source сторінки.
      </div>
    </Section>
  );
}

// ─── Tab: Скоринг ─────────────────────────────────────────────────────────────

const THRESHOLD_META = {
  make_now: { label: 'Знімати зараз', color: 'green', desc: 'Мінімальний score для вердикту "ЗНІМАТИ ЗАРАЗ"' },
  test: { label: 'Тестувати', color: 'blue', desc: 'Мінімальний score для вердикту "ТЕСТУВАТИ"' },
  watch: { label: 'Спостерігати', color: 'orange', desc: 'Мінімальний score для вердикту "СПОСТЕРІГАТИ"' },
};

const WEIGHT_META = {
  velocity: { label: 'Velocity', desc: 'Швидкість переглядів (views/day)', max: 40 },
  outlier: { label: 'Outlier', desc: 'Аномальний ріст відносно каналу/ринку', max: 40 },
  evidence: { label: 'Evidence', desc: 'Кількість відео та каналів у кластері', max: 30 },
  engagement: { label: 'Engagement', desc: 'Середній engagement rate', max: 20 },
  freshness: { label: 'Freshness', desc: 'Свіжість сигналів', max: 20 },
  comment_intent: { label: 'Comment intent', desc: 'Явний intent у коментарях', max: 15 },
  channel_fit: { label: 'Channel fit', desc: 'Відповідність ключовим словам каналу', max: 15 },
};

function WeightRow({ name, value, onChange }) {
  const meta = WEIGHT_META[name] || { label: name, desc: '', max: 30 };
  const pct = Math.round((value / meta.max) * 100);
  return (
    <div className="stWeightRow">
      <div className="stWeightLabel">
        <span>{meta.label}</span>
        <span className="stHint">{meta.desc}</span>
      </div>
      <div className="stWeightControl">
        <input
          type="range"
          className="stRange"
          min={0}
          max={meta.max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          className="stInput stInput--xs"
          min={0}
          max={meta.max}
          value={value}
          onChange={(e) => onChange(Math.min(meta.max, Math.max(0, Number(e.target.value) || 0)))}
        />
      </div>
    </div>
  );
}

function ScoringTab({ data, onChange, onSave, saving, saved }) {
  const dec = data.decision;
  const thresholds = dec.thresholds || {};
  const weights = dec.weights || {};

  function setDecision(key, value) {
    onChange({ ...data, decision: { ...dec, [key]: value } });
  }

  const totalWeight = Object.values(weights).reduce((sum, v) => sum + (Number(v) || 0), 0);

  return (
    <Section
      title="Скоринг та пороги"
      description="Налаштування алгоритму оцінки тем. Зміни впливають на наступний запуск analyze_youtube_opportunities.py."
      onSave={onSave}
      saving={saving}
      saved={saved}
    >
      <div className="stSubsection">
        <h3 className="stSubsectionTitle">Пороги вердиктів</h3>
        <div className="stThresholdGrid">
          {Object.entries(THRESHOLD_META).map(([key, meta]) => (
            <div key={key} className={`stThresholdCard stThresholdCard--${meta.color}`}>
              <div className="stThresholdLabel">{meta.label}</div>
              <input
                type="number"
                className="stInput stInput--center"
                min={0}
                max={100}
                value={thresholds[key] ?? ''}
                onChange={(e) => setDecision('thresholds', { ...thresholds, [key]: Number(e.target.value) || 0 })}
              />
              <div className="stThresholdDesc">{meta.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stSubsection">
        <h3 className="stSubsectionTitle">
          Ваги компонентів
          <span className={`stWeightTotal ${totalWeight > 110 ? 'stWeightTotal--warn' : totalWeight < 90 ? 'stWeightTotal--warn' : 'stWeightTotal--ok'}`}>
            Сума: {totalWeight} / ~100
          </span>
        </h3>
        <div className="stWeightList">
          {Object.entries(WEIGHT_META).map(([key, _]) => (
            <WeightRow
              key={key}
              name={key}
              value={Number(weights[key]) || 0}
              onChange={(v) => setDecision('weights', { ...weights, [key]: v })}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Settings nav ─────────────────────────────────────────────────────────────

const TABS = [
  { key: 'youtube_channel', label: 'YouTube канал', icon: <Youtube size={16} /> },
  { key: 'topics', label: 'Теми і ключові слова', icon: <Hash size={16} /> },
  { key: 'competitors', label: 'Конкуренти', icon: <Users size={16} /> },
  { key: 'scoring', label: 'Скоринг', icon: <Sliders size={16} /> },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('youtube_channel');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const { toasts, add: toast } = useToast();

  useEffect(() => {
    api('/api/settings')
      .then(setData)
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function save(section) {
    if (!data) return;
    setSaving((s) => ({ ...s, [section]: true }));
    setSaved((s) => ({ ...s, [section]: false }));
    try {
      const payload = {};
      if (section === 'topics') { payload.channel = data.channel; payload.decision = data.decision; }
      if (section === 'competitors') payload.competitors = data.competitors;
      if (section === 'scoring') payload.decision = data.decision;
      await api('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast(`${TABS.find((t) => t.key === section)?.label} збережено`, 'green');
      setSaved((s) => ({ ...s, [section]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [section]: false })), 2500);
    } catch (err) {
      toast(`Помилка збереження: ${err.message || err}`, 'red');
    } finally {
      setSaving((s) => ({ ...s, [section]: false }));
    }
  }

  if (loading) {
    return (
      <div className="stPage">
        <div className="stHeader">
          <Settings size={22} />
          <div><h1 className="stPageTitle">Налаштування каналу</h1></div>
        </div>
        <div className="stLoading">Завантаження налаштувань…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stPage">
        <div className="stHeader">
          <Settings size={22} />
          <div><h1 className="stPageTitle">Налаштування каналу</h1></div>
        </div>
        <div className="stError">{error || 'Не вдалося завантажити налаштування.'}</div>
      </div>
    );
  }

  return (
    <div className="stPage">
      <Toasts toasts={toasts} />

      <div className="stHeader">
        <Settings size={22} className="stHeaderIcon" />
        <div>
          <h1 className="stPageTitle">Налаштування каналу</h1>
          <p className="stPageSubtitle">Конфігурація аналітики — теми, конкуренти, ключові слова, алгоритм скорингу.</p>
        </div>
      </div>

      <div className="stLayout">
        <nav className="stNav">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              className={`stNavItem ${activeTab === key ? 'stNavItem--active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {icon}
              <span>{label}</span>
              {saved[key] && <span className="stNavSaved">✓</span>}
            </button>
          ))}
        </nav>

        <div className="stContent">
          {activeTab === 'youtube_channel' && (
            <YouTubeChannelTab
              data={data}
              onChange={setData}
              toast={toast}
            />
          )}
          {activeTab === 'topics' && (
            <TopicsTab
              data={data}
              onChange={setData}
              onSave={() => save('topics')}
              saving={saving.topics}
              saved={saved.topics}
            />
          )}
          {activeTab === 'competitors' && (
            <CompetitorsTab
              data={data}
              onChange={setData}
              onSave={() => save('competitors')}
              saving={saving.competitors}
              saved={saved.competitors}
            />
          )}
          {activeTab === 'scoring' && (
            <ScoringTab
              data={data}
              onChange={setData}
              onSave={() => save('scoring')}
              saving={saving.scoring}
              saved={saved.scoring}
            />
          )}
        </div>
      </div>
    </div>
  );
}
