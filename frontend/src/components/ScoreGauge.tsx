interface Props {
  score: number;
  status: 'PASS' | 'REVIEW' | 'FAIL';
  size?: 'lg' | 'md' | 'sm';
}

const STATUS_COLORS = {
  PASS:   '#4C7A4A',
  REVIEW: '#C9922E',
  FAIL:   '#A03B2A',
};

export default function ScoreGauge({ score, status, size = 'lg' }: Props) {
  const color = STATUS_COLORS[status];
  const fontSize = size === 'lg' ? 'text-[52px]' : size === 'md' ? 'text-[38px]' : 'text-[28px]';
  const denSize = size === 'lg' ? 'text-[15px]' : size === 'md' ? 'text-[13px]' : 'text-[11px]';

  return (
    <div className="flex items-baseline gap-3">
      <span
        className={`heading-serif ${fontSize} leading-none num`}
        style={{ color }}
      >
        {Math.round(score)}
      </span>
      <span className={`${denSize} text-[var(--color-ink-soft)]`}>/ 100</span>
    </div>
  );
}
