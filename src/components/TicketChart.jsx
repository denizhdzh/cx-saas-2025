export default function TicketChart({ analyticsData }) {
  // Get data from analytics summary
  const totalMessages = analyticsData?.summary?.totalMessages || 0;
  const totalConversations = analyticsData?.summary?.totalConversations || 0;
  const totalAIMessages = analyticsData?.summary?.totalAIMessages || 0;
  const totalTickets = analyticsData?.summary?.totalTickets || 0;
  const highConfidenceMessages = analyticsData?.summary?.highConfidenceMessages || 0;
  const ticketCreationRate = analyticsData?.summary?.ticketCreationRate || 0;
  const aiResolutionRate = analyticsData?.summary?.aiResolutionRate || 0;

  // CSAT Score: Convert sentiment (0-10 scale) to percentage
  const avgSentiment = analyticsData?.summary?.avgSentiment || 5;
  const csatScore = Math.round((avgSentiment / 10) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 dark:bg-stone-800/50 p-2 rounded-2xl">
      {/* Ticket Creation Rate */}
      <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-500/20">
        <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
          Ticket Creation Rate
        </div>
        <div className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-1">
          {ticketCreationRate}%
        </div>
        <div className="text-xs text-stone-500">
          {totalTickets} tickets from {totalConversations} conversations
        </div>
      </div>

      {/* AI Resolution Rate */}
      <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-500/20">
        <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
          AI Resolution Rate
        </div>
        <div className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-1">
          {aiResolutionRate}%
        </div>
        <div className="text-xs text-stone-500">
          {highConfidenceMessages} of {totalAIMessages} AI responses
        </div>
      </div>

      {/* CSAT Score */}
      <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-500/20">
        <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
          CSAT Score
        </div>
        <div className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-1">
          {csatScore}%
        </div>
        <div className="text-xs text-stone-500">
          Avg sentiment: {avgSentiment.toFixed(1)}/10
        </div>
      </div>
    </div>
  );
}