import React, { useState } from 'react';
import { Lightbulb, RefreshCw, Info } from 'lucide-react';
import { api } from '../lib/shared.jsx';
import IdeaInput from '../components/idea-lab/IdeaInput.jsx';
import IdeaVerdict from '../components/idea-lab/IdeaVerdict.jsx';
import IdeaComparison from '../components/idea-lab/IdeaComparison.jsx';
import IdeaEvidence from '../components/idea-lab/IdeaEvidence.jsx';
import IdeaOutputGrid from '../components/idea-lab/IdeaOutputGrid.jsx';
import SimilarVideos from '../components/idea-lab/SimilarVideos.jsx';
import { SkeletonBlock } from '../components/common/Skeleton.jsx';
import '../styles/idea-lab.css';

async function runIdeaLab(payload) {
  return api('/api/idea-lab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Backend returns { score: {finalScore, priority, confidence}, brief: {...}, evidence: {...} }
// Flatten into component-friendly structure
function normalizeIdeaResult(raw) {
  const score = raw.score || {};
  const brief = raw.brief || {};
  const dataHealth = raw.dataHealth || {};

  const broll = (brief.broll || []).map(item =>
    typeof item === 'string'
      ? item
      : [item.moment && `(${item.moment})`, item.shot].filter(Boolean).join(' ')
  );

  const priorityToPotential = { shoot_now: 'high', prepare_later: 'medium', needs_research: 'low' };

  return {
    ...raw,
    opportunityScore: score.finalScore || 0,
    verdict: score.priority || 'watch',
    confidence: score.confidence || dataHealth.confidence || null,
    evidenceQuality: dataHealth.confidence || null,
    dataHealth: { ...dataHealth, videosAnalyzed: dataHealth.directVideoSignals || dataHealth.matchedSignals || 0 },
    angle: brief.angle || brief.recommendedVideo || null,
    recommendedFormat: brief.format || null,
    hooks: brief.hooks || [],
    titles: brief.titles || [],
    broll,
    structure: brief.structure || [],
    risks: brief.risks || [],
    nextAction: brief.nextAction || null,
    potential: priorityToPotential[score.priority] || 'medium',
    whyItWorks: brief.whyItCanWork || raw.evidence?.patterns || [],
  };
}

function IdeaLabSkeleton() {
  return (
    <div className="idea-lab-loading">
      <SkeletonBlock height={120} radius={14} />
      <div className="idea-lab-loading-grid">
        {[0, 1, 2].map(i => <SkeletonBlock key={i} height={220} radius={14} />)}
      </div>
      <div className="idea-lab-loading-grid">
        {[0, 1, 2].map(i => <SkeletonBlock key={i} height={200} radius={14} />)}
      </div>
    </div>
  );
}

export default function IdeaLabPage({ route }) {
  const params = new URLSearchParams(route?.search || '');
  const initialIdea = params.get('idea') || params.get('compare') || '';

  const [idea, setIdea] = useState(initialIdea);
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function validate() {
    const trimmed = idea.trim();
    if (trimmed.length < 10) {
      setInputError('Опишіть ідею конкретніше. Мінімум 10 символів.');
      return false;
    }
    if (trimmed.length > 1500) {
      setInputError('Ідея занадто довга. Максимум 1500 символів.');
      return false;
    }
    setInputError('');
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await runIdeaLab({ idea: idea.trim(), days: 30 });
      if (!data || data.ok === false) {
        setError(data?.error || 'API не повернув результат аналізу. Перевірте backend /api/idea-lab або запустіть збір YouTube-даних.');
        return;
      }
      setResult(normalizeIdeaResult(data));
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="idea-lab-page">
      <div className="idea-lab-header">
        <div>
          <h1>
            <Lightbulb size={22} style={{ color: 'var(--blue)' }} />
            Перевірити мою ідею
          </h1>
          <p className="idea-lab-subtitle">
            Ми порівнюємо вашу ідею з реальними сигналами YouTube: попит, конкуренція, утримання.
          </p>
        </div>
        {result && (
          <button className="iconButton" onClick={() => setResult(null)} title="Нова ідея">
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      <IdeaInput
        idea={idea}
        onChange={val => { setIdea(val); if (inputError) setInputError(''); }}
        onSubmit={handleSubmit}
        loading={loading}
        error={inputError}
      />

      {error && (
        <div className="idea-lab-error">
          <p>Не вдалося проаналізувати ідею: {error}</p>
          <button className="button" onClick={handleSubmit}>
            <RefreshCw size={14} /> Спробувати ще раз
          </button>
        </div>
      )}

      {loading && <IdeaLabSkeleton />}

      {!loading && !result && !error && (
        <div className="idea-lab-initial">
          Введіть ідею, щоб порівняти її з YouTube-сигналами.
        </div>
      )}

      {!loading && result && (
        <>
          <IdeaVerdict result={result} />

          <div className="idea-main-section">
            <IdeaComparison result={result} idea={idea} />
            <IdeaEvidence result={result} />
          </div>

          <IdeaOutputGrid result={result} idea={idea} />

          <SimilarVideos result={result} />
        </>
      )}

      <div className="idea-lab-footer-note">
        <Info size={13} />
        Усі рекомендації базуються на реальних даних YouTube, а не на здогадках ШІ.
      </div>
    </div>
  );
}
