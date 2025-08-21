import Card from '../ui/Card'
import Button from '../ui/Button'

export interface PostCardProps {
	id: string
	symbol?: string | null
	summary: string
	likes: number
	onLike: (id: string) => void
}

export default function PostCard({ id, symbol, summary, likes, onLike }: PostCardProps) {
	return (
		<Card className="space-y-2">
			<div className="flex items-center justify-between text-sm">
				<div className="font-medium">{symbol ?? 'Activity'}</div>
				<Button variant="ghost" size="sm" onClick={() => onLike(id)}>Like ({likes})</Button>
			</div>
			<div className="text-sm">{summary}</div>
		</Card>
	)
}


