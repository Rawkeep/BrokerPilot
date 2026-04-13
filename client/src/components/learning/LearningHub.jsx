import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { useLearningStore } from '../../stores/learningStore.js';
import { GLOSSARY, searchGlossary } from '../../data/financeGlossary.js';
import { LessonViewer } from './LessonViewer.jsx';
import '../../styles/learning.css';

const LEVEL_LABELS = {
  einsteiger: { label: 'Einsteiger', color: '#10b981', icon: '🌱' },
  fortgeschritten: { label: 'Fortgeschritten', color: '#f59e0b', icon: '📈' },
  profi: { label: 'Profi', color: '#8b5cf6', icon: '🏆' },
};

const CATEGORY_ICONS = {
  crm: '📋', markt: '📊', krypto: '₿', finanzen: '💰', ki: '🤖', logistik: '🚚',
};

export function LearningHub() {
  const {
    level, paths, badges, earnedBadges, completedLessons,
    getTotalProgress, getPathProgress, getDailyTip, setLevel,
  } = useLearningStore();

  const [activeTab, setActiveTab] = useState('paths');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [glossarySearch, setGlossarySearch] = useState('');

  const totalProgress = getTotalProgress();
  const dailyTip = getDailyTip();
  const levelInfo = LEVEL_LABELS[level];

  const glossaryResults = glossarySearch.trim()
    ? searchGlossary(glossarySearch)
    : Object.values(GLOSSARY);

  if (selectedLesson) {
    return (
      <LessonViewer
        lesson={selectedLesson}
        onBack={() => setSelectedLesson(null)}
      />
    );
  }

  return (
    <div className="learning-hub">
      <div className="learning-hub__header">
        <h1>🎓 BrokerPilot Academy</h1>
        <p className="page-subtitle">Vom Einsteiger zum Profi — lerne die Finanzwelt und dein CRM Schritt fuer Schritt</p>
      </div>

      {/* Progress Overview */}
      <div className="learning-hub__overview">
        <GlassCard hoverable={false} className="learning-hub__level-card">
          <span className="learning-hub__level-icon">{levelInfo.icon}</span>
          <div>
            <div className="learning-hub__level-label" style={{ color: levelInfo.color }}>
              {levelInfo.label}
            </div>
            <div className="learning-hub__progress-bar">
              <div
                className="learning-hub__progress-fill"
                style={{ width: `${totalProgress}%`, background: levelInfo.color }}
              />
            </div>
            <span className="learning-hub__progress-text">{totalProgress}% abgeschlossen</span>
          </div>
        </GlassCard>

        {/* Daily Tip */}
        <GlassCard hoverable={false} className="learning-hub__tip-card">
          <div className="learning-hub__tip-header">
            <GlassBadge variant="low">{dailyTip.category}</GlassBadge>
            <span className="learning-hub__tip-label">Tipp des Tages</span>
          </div>
          <p className="learning-hub__tip-text">{dailyTip.tip}</p>
        </GlassCard>
      </div>

      {/* Level Selector */}
      <div className="learning-hub__level-selector">
        {Object.entries(LEVEL_LABELS).map(([key, info]) => (
          <button
            key={key}
            className={`learning-hub__level-btn ${level === key ? 'active' : ''}`}
            style={level === key ? { borderColor: info.color, color: info.color } : {}}
            onClick={() => setLevel(key)}
          >
            {info.icon} {info.label}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="learning-hub__tabs">
        <button
          className={`learning-hub__tab ${activeTab === 'paths' ? 'active' : ''}`}
          onClick={() => setActiveTab('paths')}
        >
          Lernpfade
        </button>
        <button
          className={`learning-hub__tab ${activeTab === 'glossary' ? 'active' : ''}`}
          onClick={() => setActiveTab('glossary')}
        >
          Finanz-Glossar
        </button>
        <button
          className={`learning-hub__tab ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          Abzeichen ({earnedBadges.length}/{badges.length})
        </button>
      </div>

      {/* Learning Paths */}
      {activeTab === 'paths' && (
        <div className="learning-hub__paths">
          {Object.values(paths).map((path) => {
            const progress = getPathProgress(path.id);
            const pathLevel = LEVEL_LABELS[path.level];
            return (
              <GlassCard key={path.id} hoverable className="learning-hub__path-card">
                <div className="learning-hub__path-header">
                  <h3>{path.title}</h3>
                  <GlassBadge variant={path.level === 'einsteiger' ? 'low' : path.level === 'fortgeschritten' ? 'medium' : 'high'}>
                    {pathLevel.icon} {pathLevel.label}
                  </GlassBadge>
                </div>
                <p className="learning-hub__path-desc">{path.description}</p>
                <div className="learning-hub__progress-bar">
                  <div
                    className="learning-hub__progress-fill"
                    style={{ width: `${progress}%`, background: pathLevel.color }}
                  />
                </div>
                <span className="learning-hub__progress-text">{progress}%</span>
                <div className="learning-hub__lessons">
                  {path.lessons.map((lesson) => {
                    const done = completedLessons.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        className={`learning-hub__lesson ${done ? 'done' : ''}`}
                        onClick={() => setSelectedLesson(lesson)}
                      >
                        <span className="learning-hub__lesson-check">
                          {done ? '✅' : '○'}
                        </span>
                        <span className="learning-hub__lesson-title">{lesson.title}</span>
                        <span className="learning-hub__lesson-duration">{lesson.duration}</span>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Glossary */}
      {activeTab === 'glossary' && (
        <div className="learning-hub__glossary">
          <input
            className="learning-hub__glossary-search glass-input"
            type="text"
            placeholder="Begriff suchen..."
            value={glossarySearch}
            onChange={(e) => setGlossarySearch(e.target.value)}
          />
          <div className="learning-hub__glossary-grid">
            {glossaryResults.map((entry) => (
              <GlassCard key={entry.term} hoverable={false} className="learning-hub__glossary-card">
                <div className="learning-hub__glossary-header">
                  <span className="learning-hub__glossary-icon">
                    {CATEGORY_ICONS[entry.category] || '📖'}
                  </span>
                  <h4>{entry.term}</h4>
                  <GlassBadge variant={entry.level === 'einsteiger' ? 'low' : entry.level === 'fortgeschritten' ? 'medium' : 'high'}>
                    {LEVEL_LABELS[entry.level]?.label}
                  </GlassBadge>
                </div>
                <p className="learning-hub__glossary-short">{entry.short}</p>
                <details className="learning-hub__glossary-details">
                  <summary>Mehr erfahren</summary>
                  <p>{entry.full}</p>
                </details>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {activeTab === 'badges' && (
        <div className="learning-hub__badges">
          {badges.map((badge) => {
            const earned = earnedBadges.includes(badge.id);
            return (
              <GlassCard
                key={badge.id}
                hoverable={false}
                className={`learning-hub__badge-card ${earned ? 'earned' : 'locked'}`}
              >
                <span className="learning-hub__badge-icon">{earned ? badge.icon : '🔒'}</span>
                <div>
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LearningHub;
