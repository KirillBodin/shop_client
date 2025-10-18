export default function ErrorAlert({ err }) {
    if (!err) return null;
    const text = typeof err === 'string' ? err : (err.message || 'Ошибка');
    return <div style={{background:'#fee', border:'1px solid #f88', padding:8, margin:'8px 0'}}>{text}</div>;
  }
  