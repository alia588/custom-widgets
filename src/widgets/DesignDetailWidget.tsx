type DesignDetailWidgetProps = {
  widgetId: string;
};

/**
 * Sample widget that replaces the DesignDetail embed.
 * Add more widgets in src/widgets/ and register them in src/widget-registry.ts.
 */
export default function DesignDetailWidget({
  widgetId,
}: DesignDetailWidgetProps) {
  return (
    <div className="dd-widget">
      <div className="dd-widget-card">
        <h3 className="dd-widget-title">Design Detail Widget</h3>
        <p className="dd-widget-id">Widget ID: {widgetId}</p>
        <p className="dd-widget-text">
          This is a custom replacement for the DesignDetail embed. Replace this
          content with your real widget UI.
        </p>
      </div>
    </div>
  );
}
