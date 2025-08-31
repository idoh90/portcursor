import Button from '../ui/Button'
import Input from '../ui/Input'

export interface CommentSectionProps {
	postId: string
	value: string
	onChange: (v: string) => void
	onSubmit: (postId: string) => void
}

export default function CommentSection({ postId, value, onChange, onSubmit }: CommentSectionProps) {
	return (
		<div className="flex gap-2 pt-1">
			<Input
				className="flex-1"
				placeholder="Write a comment"
				aria-label="Write a comment"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault()
						onSubmit(postId)
					}
				}}
			/>
			<Button size="sm" onClick={() => onSubmit(postId)}>Post</Button>
		</div>
	)
}


