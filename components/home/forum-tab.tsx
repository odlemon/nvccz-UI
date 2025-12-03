"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Heart, 
  Share2, 
  MessageCircle,
  User,
  Calendar,
  Clock,
  Send,
  Reply
} from "lucide-react"

const forumPosts = [
  {
    id: 1,
    title: "Market Analysis: ZSE Performance This Week",
    content: "What are your thoughts on the recent performance of the Zimbabwe Stock Exchange? I've noticed some interesting trends...",
    author: "John Smith",
    authorRole: "Senior Analyst",
    avatar: "/placeholder-user.jpg",
    date: "2 hours ago",
    likes: 24,
    shares: 8,
    replies: 12,
    isLiked: false,
    tags: ["Market Analysis", "ZSE", "Investment"]
  },
  {
    id: 2,
    title: "RBZ Policy Changes Impact on Investment Strategy",
    content: "The recent Reserve Bank policy changes have significant implications for our investment approach. Let's discuss...",
    author: "Sarah Johnson",
    authorRole: "Portfolio Manager",
    avatar: "/placeholder-user.jpg",
    date: "4 hours ago",
    likes: 18,
    shares: 5,
    replies: 8,
    isLiked: true,
    tags: ["Policy", "RBZ", "Strategy"]
  },
  {
    id: 3,
    title: "African Markets Outlook 2025",
    content: "Looking ahead to 2025, I believe African markets present excellent opportunities. Here's my analysis...",
    author: "Michael Chen",
    authorRole: "Research Director",
    avatar: "/placeholder-user.jpg",
    date: "6 hours ago",
    likes: 31,
    shares: 15,
    replies: 20,
    isLiked: false,
    tags: ["African Markets", "2025", "Outlook"]
  }
]

const replies = [
  {
    id: 1,
    postId: 1,
    content: "Great analysis! I agree with your points about the technology sector leading the gains.",
    author: "Emma Wilson",
    authorRole: "Investment Advisor",
    avatar: "/placeholder-user.jpg",
    date: "1 hour ago",
    likes: 5,
    isLiked: false
  },
  {
    id: 2,
    postId: 1,
    content: "The banking sector has been particularly strong this quarter. Delta's performance is impressive.",
    author: "David Brown",
    authorRole: "Financial Analyst",
    avatar: "/placeholder-user.jpg",
    date: "30 minutes ago",
    likes: 3,
    isLiked: true
  }
]

export function ForumTab() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [posts, setPosts] = useState(forumPosts)
  const [postReplies, setPostReplies] = useState(replies)
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: ""
  })
  const [replyContent, setReplyContent] = useState("")

  const handleCreatePost = () => {
    if (formData.title && formData.content) {
      const newPost = {
        id: Date.now(),
        title: formData.title,
        content: formData.content,
        author: "You",
        authorRole: "Member",
        avatar: "/placeholder-user.jpg",
        date: "Just now",
        likes: 0,
        shares: 0,
        replies: 0,
        isLiked: false,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
      setPosts([newPost, ...posts])
      setFormData({ title: "", content: "", tags: "" })
      setShowCreateForm(false)
    }
  }

  const handleReply = (postId: number) => {
    if (replyContent.trim()) {
      const newReply = {
        id: Date.now(),
        postId,
        content: replyContent,
        author: "You",
        authorRole: "Member",
        avatar: "/placeholder-user.jpg",
        date: "Just now",
        likes: 0,
        isLiked: false
      }
      setPostReplies([newReply, ...postReplies])
      setReplyContent("")
      setSelectedPost(null)
    }
  }

  const toggleLike = (id: number, type: 'post' | 'reply') => {
    if (type === 'post') {
      setPosts(prev => prev.map(post => {
        if (post.id === id) {
          const wasLiked = post.isLiked
          const newLiked = !wasLiked
          
          // Show toast notification
          if (newLiked) {
            toast.success("❤️ Liked post!", {
              description: `"${post.title}" added to your favorites`,
              duration: 3000,
            })
          } else {
            toast.info("💔 Unliked post", {
              description: `"${post.title}" removed from your favorites`,
              duration: 3000,
            })
          }
          
          return { 
            ...post, 
            isLiked: newLiked,
            likes: wasLiked ? post.likes - 1 : post.likes + 1
          }
        }
        return post
      }))
    } else {
      setPostReplies(prev => prev.map(reply => {
        if (reply.id === id) {
          const wasLiked = reply.isLiked
          const newLiked = !wasLiked
          
          // Show toast notification
          if (newLiked) {
            toast.success("❤️ Liked reply!", {
              description: `Reply by ${reply.author} added to your favorites`,
              duration: 3000,
            })
          } else {
            toast.info("💔 Unliked reply", {
              description: `Reply by ${reply.author} removed from your favorites`,
              duration: 3000,
            })
          }
          
          return { 
            ...reply, 
            isLiked: newLiked,
            likes: wasLiked ? reply.likes - 1 : reply.likes + 1
          }
        }
        return reply
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Post Section */}
      <div className="border border-gray-200 rounded-xl p-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageCircle className="w-5 h-5" />
              Community Forum
            </CardTitle>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-6 py-2"
            >
              <Plus className="w-4 h-4" />
              Create New Post
            </Button>
          </div>
        </CardHeader>
        
        {showCreateForm && (
          <CardContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 border rounded-lg bg-gray-50"
            >
              <div>
                <label className="text-sm text-gray-700 mb-2 block">
                  Post Title
                </label>
                <Input
                  placeholder="Enter post title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-700 mb-2 block">
                  Content
                </label>
                <Textarea
                  placeholder="Write your post content..."
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-700 mb-2 block">
                  Tags (comma separated)
                </label>
                <Input
                  placeholder="e.g., Market Analysis, Investment, Strategy"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreatePost} 
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-full px-6 py-2"
                >
                  <Send className="w-4 h-4" />
                  Publish Post
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </CardContent>
        )}
      </div>

      {/* Forum Posts */}
      <div className="space-y-4">
        <h3 className="text-xl text-gray-900">Recent Posts</h3>
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="transition-all duration-300 border rounded-xl border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Post Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                      {post.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base text-gray-900">{post.author}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {post.authorRole}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {post.date}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div>
                    <h5 className="text-xl text-gray-900 mb-2">
                      {post.title}
                    </h5>
                    <p className="text-gray-600 mb-3">
                      {post.content}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, idx) => {
                        // Different gradient colors for variety
                        const gradients = [
                          "bg-gradient-to-r from-blue-500 to-purple-600",
                          "bg-gradient-to-r from-green-500 to-teal-600", 
                          "bg-gradient-to-r from-orange-500 to-red-600",
                          "bg-gradient-to-r from-pink-500 to-rose-600",
                          "bg-gradient-to-r from-indigo-500 to-blue-600",
                          "bg-gradient-to-r from-emerald-500 to-green-600"
                        ]
                        const gradientClass = gradients[idx % gradients.length]
                        
                        return (
                          <span 
                            key={idx} 
                            className={`${gradientClass} text-white text-xs px-3 py-1 rounded-full font-medium hover:opacity-80 cursor-pointer transition-all duration-200 shadow-sm`}
                          >
                            {tag}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id, 'post')}
                        className={`flex items-center gap-1 rounded-full hover:bg-gray-100 cursor-pointer ${
                          post.isLiked ? 'text-red-500' : 'text-gray-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        {post.likes}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                        className="flex items-center gap-1 text-gray-500 rounded-full hover:bg-gray-100 cursor-pointer"
                      >
                        <Reply className="w-4 h-4" />
                        {post.replies} Replies
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-500 rounded-full hover:bg-gray-100 cursor-pointer">
                        <Share2 className="w-4 h-4" />
                        {post.shares}
                      </Button>
                    </div>
                  </div>

                  {/* Reply Section */}
                  {selectedPost === post.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t pt-4 space-y-3"
                    >
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => handleReply(post.id)}
                          size="sm"
                          className="self-end"
                        >
                          Reply
                        </Button>
                      </div>
                      
                      {/* Existing Replies */}
                      <div className="space-y-3">
                        {postReplies
                          .filter(reply => reply.postId === post.id)
                          .map((reply) => (
                            <div key={reply.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                                {reply.author.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm">{reply.author}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {reply.authorRole}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{reply.date}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{reply.content}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleLike(reply.id, 'reply')}
                                  className={`h-6 px-2 text-xs rounded-full hover:bg-gray-100 cursor-pointer ${
                                    reply.isLiked ? 'text-red-500' : 'text-gray-500'
                                  }`}
                                >
                                  <Heart className={`w-3 h-3 mr-1 ${reply.isLiked ? 'fill-current' : ''}`} />
                                  {reply.likes}
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
