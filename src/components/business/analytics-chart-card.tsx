import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { Button, Card, Empty, Skeleton, Typography } from 'antd';
import { useEffect, useRef } from 'react';

type AnalyticsChartCardProps = {
  title: string;
  description: string;
  option?: EChartsOption;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyDescription?: string;
  onRetry?: () => void;
  minHeight?: number;
};

export function AnalyticsChartCard({
  title,
  description,
  option,
  loading = false,
  error = false,
  empty = false,
  emptyDescription = '当前区间暂无数据',
  onRetry,
  minHeight = 320,
}: AnalyticsChartCardProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !option || loading || error || empty) {
      return;
    }

    const chart = echarts.init(chartRef.current);
    chart.setOption(option);
    instanceRef.current = chart;

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      instanceRef.current = null;
    };
  }, [empty, error, loading, option]);

  return (
    <Card className="surface-card analytics-chart-card" bordered={false}>
      <div className="section-heading">
        <Typography.Title level={4}>{title}</Typography.Title>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : null}

      {!loading && error ? (
        <div className="analytics-chart-card__empty" style={{ minHeight }}>
          <Empty
            description="图表加载失败"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {onRetry ? <Button onClick={onRetry}>重新加载</Button> : null}
          </Empty>
        </div>
      ) : null}

      {!loading && !error && empty ? (
        <div className="analytics-chart-card__empty" style={{ minHeight }}>
          <Empty
            description={emptyDescription}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : null}

      {!loading && !error && !empty ? (
        <div
          ref={chartRef}
          className="analytics-chart-card__canvas"
          style={{ minHeight }}
        />
      ) : null}
    </Card>
  );
}
