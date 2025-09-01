export interface Post {
  id: string;
  userId: string;
  createdAt: string; // ISO
  kind: 'new_position' | 'lot_added' | 'position_closed' | 'note';
  payload: Record<string, unknown>;
  likeCount: number;
  commentCount: number;
  youLiked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
  text: string;
}


