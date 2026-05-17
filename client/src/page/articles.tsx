import { SettingsCard, SettingsCardBody, SettingsCardHeader, SettingsBadge } from "@rin/ui";
import { client } from "../app/runtime";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import ReactLoading from "react-loading";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { Link } from "wouter";
import { useAlert, useConfirm } from "../components/dialog";
import { Button } from "@rin/ui";

interface FeedItem {
  id: number;
  title: string;
  alias: string | null;
  summary: string;
  draft: number;
  listed: number;
  top: number;
  createdAt: string;
  updatedAt: string;
  pv: number;
  uv: number;
  hashtags: { id: number; name: string }[];
}

export function ArticlesPage() {
  const siteConfig = useSiteConfig();
  const [loading, setLoading] = useState(true);
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "unlisted">("all");
  const { showAlert, AlertUI } = useAlert();
  const { showConfirm, ConfirmUI } = useConfirm();

  const fetchFeeds = (p: number, type?: string) => {
    setLoading(true);
    const params: any = { page: p, limit: 20 };
    if (type === "draft") params.type = "draft";
    else if (type === "unlisted") params.type = "unlisted";

    client.feed.list(params).then(({ data, error }: any) => {
      if (error) {
        showAlert(error.value || "加载失败");
      } else if (data) {
        let items = data.data || data;
        if (type === "published") {
          items = items.filter((f: FeedItem) => !f.draft && f.listed);
        }
        setFeeds(items);
        setHasNext(data.hasNext || false);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchFeeds(page, filter === "all" ? undefined : filter);
  }, [page, filter]);

  const handleDelete = (id: number, title: string) => {
    showConfirm("确认删除", `确定删除「${title}」吗？此操作不可恢复。`, async () => {
      const { error } = await client.feed.delete(id) as any;
      if (error) {
        showAlert(error.value || "删除失败");
      } else {
        fetchFeeds(page, filter === "all" ? undefined : filter);
      }
    });
  };

  const handleToggleTop = async (id: number, currentTop: number) => {
    const { error } = await client.feed.setTop(id, currentTop > 0 ? 0 : 1) as any;
    if (error) {
      showAlert(error.value || "操作失败");
    } else {
      fetchFeeds(page, filter === "all" ? undefined : filter);
    }
  };

  const handleToggleDraft = async (id: number, currentDraft: number) => {
    const { error } = await client.feed.update(id, { draft: currentDraft ? false : true, listed: true }) as any;
    if (error) {
      showAlert(error.value || "操作失败");
    } else {
      fetchFeeds(page, filter === "all" ? undefined : filter);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (feed: FeedItem) => {
    if (feed.draft) return <SettingsBadge tone="warning">草稿</SettingsBadge>;
    if (!feed.listed) return <SettingsBadge tone="neutral">未列出</SettingsBadge>;
    return <SettingsBadge tone="success">已发布</SettingsBadge>;
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <Helmet>
        <title>{`文章管理 - ${siteConfig.name}`}</title>
      </Helmet>

      <AlertUI />
      <ConfirmUI />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <SettingsCard>
          <SettingsCardHeader title={String(feeds.length)} description="当前页文章" />
        </SettingsCard>
        <SettingsCard tone="success">
          <SettingsCardHeader title={String(feeds.filter(f => !f.draft && f.listed).length)} description="已发布" />
        </SettingsCard>
        <SettingsCard tone="warning">
          <SettingsCardHeader title={String(feeds.filter(f => f.draft).length)} description="草稿" />
        </SettingsCard>
        <SettingsCard>
          <SettingsCardHeader title={String(feeds.filter(f => f.top > 0).length)} description="置顶" />
        </SettingsCard>
      </div>

      {/* 筛选和操作栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(["all", "published", "draft", "unlisted"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-theme text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10"
              }`}
            >
              {f === "all" ? "全部" : f === "published" ? "已发布" : f === "draft" ? "草稿" : "未列出"}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Link href="/admin/writing">
            <Button title="+ 写文章" onClick={() => {}} />
          </Link>
        </div>
      </div>

      {/* 加载状态 */}
      {loading ? (
        <div className="flex items-center gap-3 py-8 text-sm text-neutral-500">
          <ReactLoading width="1.25em" height="1.25em" type="spin" color="#FC466B" />
          <span>加载中...</span>
        </div>
      ) : null}

      {/* 文章列表 */}
      {!loading && feeds.length === 0 ? (
        <SettingsCard>
          <SettingsCardHeader title="暂无文章" description="点击上方「写文章」创建第一篇" />
        </SettingsCard>
      ) : null}

      {!loading && feeds.length > 0 ? (
        <div className="space-y-3">
          {feeds.map((feed) => (
            <SettingsCard key={feed.id}>
              <SettingsCardBody>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* 左侧信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {feed.top > 0 ? (
                        <span className="text-xs text-theme font-bold">置顶</span>
                      ) : null}
                      <h3 className="truncate text-base font-semibold t-primary">
                        <Link href={`/admin/writing/${feed.id}`} className="hover:text-theme transition-colors">
                          {feed.title}
                        </Link>
                      </h3>
                      {getStatusBadge(feed)}
                    </div>
                    <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
                      {feed.summary || "无摘要"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span>ID: {feed.id}</span>
                      {feed.alias ? <span>别名: {feed.alias}</span> : null}
                      <span>创建: {formatDate(feed.createdAt)}</span>
                      <span>{feed.pv || 0} PV</span>
                      {feed.hashtags?.length ? (
                        <span>标签: {feed.hashtags.map(h => h.name).join(", ")}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* 右侧操作 */}
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/admin/writing/${feed.id}`}>
                      <button className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors">
                        编辑
                      </button>
                    </Link>
                    <button
                      onClick={() => handleToggleTop(feed.id, feed.top)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        feed.top > 0
                          ? "bg-theme/10 text-theme hover:bg-theme/20"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10"
                      }`}
                    >
                      {feed.top > 0 ? "取消置顶" : "置顶"}
                    </button>
                    <button
                      onClick={() => handleToggleDraft(feed.id, feed.draft)}
                      className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors"
                    >
                      {feed.draft ? "发布" : "转为草稿"}
                    </button>
                    <button
                      onClick={() => handleDelete(feed.id, feed.title)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </SettingsCardBody>
            </SettingsCard>
          ))}
        </div>
      ) : null}

      {/* 分页 */}
      {!loading && (page > 1 || hasNext) ? (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-neutral-500">第 {page} 页</span>
          <button
            disabled={!hasNext}
            onClick={() => setPage(p => p + 1)}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors"
          >
            下一页
          </button>
        </div>
      ) : null}
    </div>
  );
}
