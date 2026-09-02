interface Props {
  status: 'PASS' | 'REVIEW' | 'FAIL';
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const variant =
    status === 'PASS'   ? 'pill pill-pass' :
    status === 'REVIEW' ? 'pill pill-review' :
                          'pill pill-fail';
  const label = status === 'PASS' ? 'Pass' : status === 'REVIEW' ? 'Review' : 'Fail';
  return <span className={`${variant} ${className}`}>{label}</span>;
}
