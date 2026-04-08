import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { API_BASE } from '../../config.js';

const currencyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const empfMap = { kaufen: 'Kaufen', halten: 'Halten', verkaufen: 'Verkaufen' };

export function ClientPortal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signed, setSigned] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/portal/${token}`)
      .then((r) => { if (!r.ok) throw new Error('Portal nicht gefunden'); return r.json(); })
      .then((d) => { setData(d); setSigned(d.isSigned); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Signature canvas
  function startDraw(e) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function draw(e) {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function stopDraw() { setIsDrawing(false); }
  function clearCanvas() {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  async function handleSign() {
    const signatureData = canvasRef.current?.toDataURL('image/png');
    const res = await fetch(`${API_BASE}/api/portal/${token}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureData }),
    });
    if (res.ok) setSigned(true);
  }

  async function handleMessage() {
    if (!message.trim()) return;
    const res = await fetch(`${API_BASE}/api/portal/${token}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (res.ok) { setMessageSent(true); setMessage(''); }
  }

  if (loading) return <div className="portal"><div className="portal__loading">Laden...</div></div>;
  if (error) return <div className="portal"><div className="portal__error">{error}</div></div>;
  if (!data) return null;

  const p = data.proposal || {};

  return (
    <div className="portal">
      <header className="portal__header">
        <h1 className="portal__brand">BrokerPilot</h1>
        <p className="portal__subtitle">Angebot fuer {data.leadName}</p>
      </header>

      {/* Summary */}
      {p.zusammenfassung && (
        <section className="portal__section">
          <h2>Zusammenfassung</h2>
          <p>{p.zusammenfassung}</p>
        </section>
      )}

      {/* Badges */}
      <div className="portal__badges">
        {p.bewertung && (
          <div className="portal__badge">
            <span className="portal__badge-label">Score</span>
            <span className="portal__badge-value">{p.bewertung.score}/100</span>
          </div>
        )}
        {p.marktanalyse && (
          <div className="portal__badge">
            <span className="portal__badge-label">Empfehlung</span>
            <span className="portal__badge-value">{empfMap[p.marktanalyse.empfehlung] || p.marktanalyse.empfehlung}</span>
          </div>
        )}
        {p.meta?.dealValue && (
          <div className="portal__badge">
            <span className="portal__badge-label">Deal-Wert</span>
            <span className="portal__badge-value">{p.meta.dealValue}</span>
          </div>
        )}
      </div>

      {/* Market Analysis */}
      {p.marktanalyse && (
        <section className="portal__section">
          <h2>Marktanalyse</h2>
          <p>{p.marktanalyse.analyse}</p>
          {p.marktanalyse.chancen?.length > 0 && (
            <><strong>Chancen:</strong><ul>{p.marktanalyse.chancen.map((c, i) => <li key={i}>{c}</li>)}</ul></>
          )}
          {p.marktanalyse.risiken?.length > 0 && (
            <><strong>Risiken:</strong><ul>{p.marktanalyse.risiken.map((r, i) => <li key={i}>{r}</li>)}</ul></>
          )}
        </section>
      )}

      {/* Strategy */}
      {p.strategie?.empfehlung && (
        <section className="portal__section">
          <h2>Strategische Empfehlung</h2>
          <p>{p.strategie.empfehlung}</p>
        </section>
      )}

      {/* Next Steps */}
      {p.naechsteSchritte?.length > 0 && (
        <section className="portal__section">
          <h2>Naechste Schritte</h2>
          <ol>{p.naechsteSchritte.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      )}

      {/* E-Signature */}
      <section className="portal__section portal__sign-section">
        <h2>Unterschrift</h2>
        {signed ? (
          <p className="portal__signed">✅ Angebot wurde unterschrieben. Vielen Dank!</p>
        ) : (
          <>
            <p>Bitte unterschreiben Sie hier um das Angebot anzunehmen:</p>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="portal__signature-pad"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            <div className="portal__sign-actions">
              <button className="portal__btn portal__btn--secondary" onClick={clearCanvas}>Löschen</button>
              <button className="portal__btn portal__btn--primary" onClick={handleSign}>Angebot annehmen</button>
            </div>
          </>
        )}
      </section>

      {/* Contact */}
      <section className="portal__section">
        <h2>Nachricht an Ihren Berater</h2>
        {messageSent ? (
          <p className="portal__signed">✅ Nachricht gesendet!</p>
        ) : (
          <div className="portal__message-form">
            <textarea
              className="portal__textarea"
              placeholder="Ihre Nachricht..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <button className="portal__btn portal__btn--primary" onClick={handleMessage}>Senden</button>
          </div>
        )}
      </section>

      <footer className="portal__footer">
        Generiert mit BrokerPilot KI-Pipeline
      </footer>
    </div>
  );
}
