import { formatDate, formatLapTime } from "@/lib/time";
import { DriverName } from "@/components/DriverName";
import { RainIndicator } from "@/components/RainIndicator";
import { publicText } from "@/lib/public-text";

export function ScoreboardTable({ entries, title, emptyMessage, showSetup = false }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      {entries.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="table-wrap">
          <table className="score-table">
            <thead>
              <tr>
                <th>{publicText.table.rank}</th>
                <th>{publicText.table.driver}</th>
                <th>{publicText.table.lap}</th>
                <th>{publicText.table.circuit}</th>
                {showSetup && <th>{publicText.table.setup}</th>}
                <th>{publicText.table.date}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td>{index + 1}</td>
                  <td><DriverName name={entry.driver_name} showCode /></td>
                  <td className="lap-value">
                    <span className="lap-value-content">
                      <span>{formatLapTime(entry.lap_time_ms)}</span>
                      <RainIndicator isWet={entry.is_wet} />
                    </span>
                  </td>
                  <td>{entry.track_name}</td>
                  {showSetup && <td>{entry.setup}</td>}
                  <td>{formatDate(entry.session_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
