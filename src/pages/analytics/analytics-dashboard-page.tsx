import { ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Segmented,
  Space,
  Statistic,
  Typography,
} from 'antd';
import type { EChartsOption } from 'echarts';
import { useMemo, useState } from 'react';

import {
  getAnalyticsIntents,
  getAnalyticsOverview,
  getAnalyticsPerformance,
  getAnalyticsSources,
  getAnalyticsTrends,
} from '../../api/analytics';
import { AnalyticsChartCard } from '../../components/business/analytics-chart-card';
import { ContentState } from '../../components/common/content-state';
import { PageHeader } from '../../components/common/page-header';
import type {
  AnalyticsIntentStat,
  AnalyticsOverview,
  AnalyticsPerformance,
  AnalyticsSourceStat,
  AnalyticsTrendPoint,
} from '../../types/analytics';

const DAY_OPTIONS = [7, 15, 30] as const;

function formatNumber(value?: number) {
  if (value === undefined || value === null) {
    return '0';
  }

  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatStatisticValue(value: string | number | undefined) {
  if (value === undefined || value === null) {
    return '0';
  }

  return formatNumber(Number(value));
}

export function AnalyticsDashboardPage() {
  const [days, setDays] = useState<number>(7);

  const overviewQuery = useQuery({
    queryKey: ['analytics-overview', days],
    queryFn: () => getAnalyticsOverview(days),
  });

  const trendsQuery = useQuery({
    queryKey: ['analytics-trends', days],
    queryFn: () => getAnalyticsTrends(days),
  });

  const intentsQuery = useQuery({
    queryKey: ['analytics-intents', days],
    queryFn: () => getAnalyticsIntents(days),
  });

  const sourcesQuery = useQuery({
    queryKey: ['analytics-sources', days],
    queryFn: () => getAnalyticsSources(days),
  });

  const performanceQuery = useQuery({
    queryKey: ['analytics-performance', days],
    queryFn: () => getAnalyticsPerformance(days),
  });

  const initialLoading =
    overviewQuery.isLoading &&
    trendsQuery.isLoading &&
    intentsQuery.isLoading &&
    sourcesQuery.isLoading &&
    performanceQuery.isLoading;

  const allFailed =
    overviewQuery.isError &&
    trendsQuery.isError &&
    intentsQuery.isError &&
    sourcesQuery.isError &&
    performanceQuery.isError;

  const trendOption = useMemo<EChartsOption | undefined>(() => {
    const points = (trendsQuery.data as AnalyticsTrendPoint[] | undefined) ?? [];
    if (!points.length) {
      return undefined;
    }

    return {
      animation: false,
      color: ['#1e6a67', '#5f7e62', '#9a621d', '#6f7f8d'],
      grid: {
        left: 24,
        right: 16,
        top: 24,
        bottom: 24,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: points.map((item) => item.statDate),
        axisLine: { lineStyle: { color: '#bfc4bd' } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#e1e4de' } },
      },
      series: [
        {
          name: '新建会话',
          type: 'line',
          smooth: false,
          data: points.map((item) => item.sessionsCreated ?? 0),
        },
        {
          name: '总消息数',
          type: 'line',
          smooth: false,
          data: points.map((item) => item.messagesTotal ?? 0),
        },
        {
          name: 'Knowledge 回答',
          type: 'line',
          smooth: false,
          data: points.map((item) => item.knowledgeAnswers ?? 0),
        },
        {
          name: 'Agent 回答',
          type: 'line',
          smooth: false,
          data: points.map((item) => item.agentAnswers ?? 0),
        },
      ],
    };
  }, [trendsQuery.data]);

  const intentsOption = useMemo<EChartsOption | undefined>(() => {
    const stats = (intentsQuery.data as AnalyticsIntentStat[] | undefined) ?? [];
    if (!stats.length) {
      return undefined;
    }

    return {
      animation: false,
      color: ['#1e6a67', '#5f7e62', '#9a621d', '#6f7f8d', '#b2432f'],
      tooltip: {
        trigger: 'item',
      },
      legend: {
        bottom: 0,
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          avoidLabelOverlap: true,
          label: {
            formatter: '{b}: {d}%',
          },
          data: stats.map((item) => ({
            name: item.intent,
            value: item.hitCount,
          })),
        },
      ],
    };
  }, [intentsQuery.data]);

  const sourcesOption = useMemo<EChartsOption | undefined>(() => {
    const stats = (sourcesQuery.data as AnalyticsSourceStat[] | undefined) ?? [];
    if (!stats.length) {
      return undefined;
    }

    return {
      animation: false,
      color: ['#1e6a67'],
      grid: {
        left: 24,
        right: 16,
        top: 16,
        bottom: 24,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#e1e4de' } },
      },
      yAxis: {
        type: 'category',
        data: stats.map((item) => item.source),
        axisLine: { lineStyle: { color: '#bfc4bd' } },
      },
      series: [
        {
          type: 'bar',
          data: stats.map((item) => item.hitCount),
          barWidth: 18,
          borderRadius: 6,
        },
      ],
    };
  }, [sourcesQuery.data]);

  if (initialLoading) {
    return (
      <ContentState
        loading
        title="正在加载 Analytics 看板"
        description="系统正在同步指标、趋势、意图分布和来源分布。"
      />
    );
  }

  if (allFailed) {
    return (
      <ContentState
        error
        title="Analytics 看板加载失败"
        description="请检查 Analytics 服务或稍后重试。"
        action={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              void overviewQuery.refetch();
              void trendsQuery.refetch();
              void intentsQuery.refetch();
              void sourcesQuery.refetch();
              void performanceQuery.refetch();
            }}
          >
            重新加载
          </Button>
        }
      />
    );
  }

  const overview = overviewQuery.data as AnalyticsOverview | undefined;
  const performance = performanceQuery.data as AnalyticsPerformance | undefined;

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Analytics"
        title="运营分析看板"
        description="当前看板按 days 维度展示规模、趋势、来源与性能，不做营销式大屏表达。"
        extra={
          <Segmented
            options={DAY_OPTIONS.map((item) => ({
              label: `${item} 天`,
              value: item,
            }))}
            value={days}
            onChange={(value: string | number) => setDays(Number(value))}
          />
        }
      />

      {overviewQuery.isError ? (
        <Card className="surface-card" bordered={false}>
          <ContentState
            error
            title="概览指标加载失败"
            description="请稍后重试，或检查 overview 接口是否可用。"
            action={
              <Button onClick={() => overviewQuery.refetch()}>重新加载</Button>
            }
          />
        </Card>
      ) : null}

      {!overviewQuery.isError ? (
        <Row gutter={[18, 18]}>
          <Col xs={24} sm={12} xl={6}>
            <Card className="surface-card analytics-kpi-card" bordered={false} loading={overviewQuery.isFetching && !overview}>
              <Statistic
                title="总会话数"
                value={overview?.totalSessions ?? 0}
                formatter={formatStatisticValue}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="surface-card analytics-kpi-card" bordered={false} loading={overviewQuery.isFetching && !overview}>
              <Statistic
                title="总消息数"
                value={overview?.totalMessages ?? 0}
                formatter={formatStatisticValue}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="surface-card analytics-kpi-card" bordered={false} loading={overviewQuery.isFetching && !overview}>
              <Statistic
                title="用户数"
                value={overview?.uniqueUsers ?? 0}
                formatter={formatStatisticValue}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="surface-card analytics-kpi-card" bordered={false} loading={overviewQuery.isFetching && !overview}>
              <Statistic
                title="平均耗时"
                value={overview?.avgDurationMs ?? 0}
                suffix="ms"
                precision={1}
              />
            </Card>
          </Col>
        </Row>
      ) : null}

      <AnalyticsChartCard
        title="趋势图"
        description="展示最近 N 天会话增长、消息规模和 knowledge / agent 回答变化。"
        option={trendOption}
        loading={trendsQuery.isFetching && !trendOption}
        error={trendsQuery.isError}
        empty={!trendOption}
        emptyDescription="当前区间没有趋势数据"
        onRetry={() => trendsQuery.refetch()}
        minHeight={360}
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={12}>
          <AnalyticsChartCard
            title="意图分布"
            description="按命中次数观察 FAQ、Policy、Order、Ticket、Escalation 的占比。"
            option={intentsOption}
            loading={intentsQuery.isFetching && !intentsOption}
            error={intentsQuery.isError}
            empty={!intentsOption}
            emptyDescription="当前区间没有意图分布数据"
            onRetry={() => intentsQuery.refetch()}
          />
        </Col>
        <Col xs={24} xl={12}>
          <AnalyticsChartCard
            title="来源分布"
            description="观察 knowledge / agent 等回答来源的命中次数。"
            option={sourcesOption}
            loading={sourcesQuery.isFetching && !sourcesOption}
            error={sourcesQuery.isError}
            empty={!sourcesOption}
            emptyDescription="当前区间没有来源分布数据"
            onRetry={() => sourcesQuery.refetch()}
          />
        </Col>
      </Row>

      <Card className="surface-card" bordered={false}>
        <div className="section-heading">
          <Typography.Title level={4}>性能指标区</Typography.Title>
          <Typography.Text type="secondary">
            聚焦 token、耗时、引用质量与 Agent 成功率。
          </Typography.Text>
        </div>

        {performanceQuery.isFetching && !performance ? (
          <ContentState
            loading
            title="正在加载性能指标"
            description="系统正在同步性能与质量统计。"
          />
        ) : null}

        {!performanceQuery.isFetching && performanceQuery.isError ? (
          <div className="analytics-chart-card__empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="性能指标加载失败"
            >
              <Button onClick={() => performanceQuery.refetch()}>重新加载</Button>
            </Empty>
          </div>
        ) : null}

        {!performanceQuery.isFetching && !performanceQuery.isError && !performance ? (
          <div className="analytics-chart-card__empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="当前区间没有性能指标数据"
            />
          </div>
        ) : null}

        {!performanceQuery.isFetching && !performanceQuery.isError && performance ? (
          <Row gutter={[18, 18]}>
            <Col xs={24} sm={12} xl={8}>
              <Card className="surface-card surface-card--muted analytics-performance-card" bordered={false}>
                <Statistic
                  title="总 Token"
                  value={performance.totalTokens ?? 0}
                  formatter={formatStatisticValue}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Card className="surface-card surface-card--muted analytics-performance-card" bordered={false}>
                <Statistic
                  title="平均每次回答 Token"
                  value={performance.avgTokensPerAnswer ?? 0}
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Card className="surface-card surface-card--muted analytics-performance-card" bordered={false}>
                <Statistic
                  title="平均耗时"
                  value={performance.avgDurationMs ?? 0}
                  suffix="ms"
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Card className="surface-card surface-card--muted analytics-performance-card" bordered={false}>
                <Statistic
                  title="平均引用数"
                  value={performance.avgReferencesPerAnswer ?? 0}
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Card className="surface-card surface-card--muted analytics-performance-card" bordered={false}>
                <Statistic
                  title="有引用回答数"
                  value={performance.groundedAnswers ?? 0}
                  formatter={formatStatisticValue}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Card className="surface-card surface-card--muted analytics-performance-card" bordered={false}>
                <Statistic
                  title="Agent 成功率"
                  value={performance.agentSuccessRate ?? 0}
                  suffix="%"
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Card className="surface-card surface-card--muted analytics-performance-card" bordered={false}>
                <Statistic
                  title="转人工次数"
                  value={performance.escalationCount ?? 0}
                  formatter={formatStatisticValue}
                />
              </Card>
            </Col>
          </Row>
        ) : null}
      </Card>
    </Space>
  );
}
