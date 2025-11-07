import BoardView from './BoardView'

export default function BoardPage({ params }: { params: { id: string } }) {
  return <BoardView boardId={params.id} />
}
