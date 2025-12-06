"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CiClock1, CiLink } from "react-icons/ci";
import { HiTrendingUp } from "react-icons/hi";
import { Loader2 } from "lucide-react";

interface NewsArticle {
  article_id: string;
  title: string;
  link: string;
  keywords?: string[] | null;
  creator?: string[] | null;
  video_url?: string | null;
  description?: string | null;
  content?: string | null;
  pubDate: string;
  pubDateTZ?: string;
  image_url?: string | null;
  source_id: string;
  source_priority: number;
  source_name?: string;
  source_url?: string;
  source_icon?: string | null;
  source_logo?: string | null;
  language: string;
  country?: string[];
  category?: string[];
  ai_tag?: string;
  sentiment?: string;
  sentiment_stats?: string;
  ai_region?: string;
  ai_org?: string;
  duplicate?: boolean;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
  nextPage?: string;
}

const NEWS_API_URL = "https://newsdata.io/api/1/latest?apikey=pub_593f3f328cd54e43b55ccfb18adfd9e8&q=Zimbabwe&language=en";
const FALLBACK_IMAGE = "https://picsum.photos/800/400?random=";

export function NewsTab() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async (pageToken?: string) => {
    try {
      setLoading(true);
      const url = pageToken 
        ? `${NEWS_API_URL}&page=${pageToken}`
        : NEWS_API_URL;
      
      const response = await fetch(url);
      const data: NewsResponse = await response.json();
      
      if (data.status === "success") {
        setNews(prev => pageToken ? [...prev, ...data.results] : data.results);
        setNextPage(data.nextPage || null);
      } else {
        toast.error("Failed to load news");
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (pubDate: string) => {
    const date = new Date(pubDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const categories = ["all", ...Array.from(new Set(news.flatMap(n => n.category || [])))];
  
  const filteredNews = activeFilter === "all" 
    ? news 
    : news.filter(n => n.category?.includes(activeFilter));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 6).map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-4 py-2 rounded-full text-sm transition-all duration-200 capitalize ${
                activeFilter === category
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
              {category === "all" && (
                <span className="ml-1 text-xs opacity-75">({news.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {loading && news.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-40 h-3 bg-gray-200 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="w-3/5 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-full h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="w-11/12 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-full h-48 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredNews.map((article, index) => (
          <motion.div
            key={article.article_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="transition-all duration-300 border rounded-xl border-gray-200 hover:border-blue-300 hover:shadow-lg">
              <div className="p-6">
                {/* Article Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {article.source_icon ? (
                      <img 
                        src={article.source_icon} 
                        alt={article.source_name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={article.source_icon ? "" : "w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"}>
                      {!article.source_icon && (
                        <span className="text-white text-sm">
                          {article.source_name?.slice(0, 2).toUpperCase() || 'ZW'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-base text-gray-900">{article.source_name || article.source_id}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CiClock1 className="w-4 h-4" />
                        <span>{formatTimeAgo(article.pubDate)}</span>
                        {article.sentiment === "positive" && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1 text-green-500">
                              <HiTrendingUp className="w-4 h-4" />
                              <span className="text-xs">Positive</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {article.category?.slice(0, 2).map(cat => (
                      <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Article Content */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 cursor-pointer transition-colors">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {article.description}
                    </p>
                  )}
                </div>

                {/* Article Image */}
                {article.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = `${FALLBACK_IMAGE}${index}`;
                      }}
                    />
                  </div>
                )}

                {/* Keywords */}
                {article.keywords && article.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.keywords.slice(0, 5).map((keyword, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                        #{keyword}
                      </span>
                    ))}
                  </div>
                )}

                {/* Article Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    {article.creator && article.creator.length > 0 && (
                      <span className="text-sm text-gray-500">
                        By {article.creator.join(", ")}
                      </span>
                    )}
                  </div>
                  
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors text-sm"
                  >
                    <CiLink className="w-4 h-4" />
                    Read Full Article
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {nextPage && (
        <div className="text-center pt-4">
          <button 
            onClick={() => loadNews(nextPage)}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More News"
            )}
          </button>
        </div>
      )}

      {filteredNews.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No news articles found</p>
        </div>
      )}
    </div>
  );
}
