import { useMemo } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import TicketCard from './TicketCard';
import { STATUSES } from '../../lib/constants';
import { cn } from '../../lib/cn';

export default function KanbanBoard({ tickets = [], canWrite = false, onMove, onAddTicket }) {
  const grouped = useMemo(() => {
    const map = { todo: [], in_progress: [], done: [] };
    tickets.forEach((ticket) => {
      if (!map[ticket.status]) map[ticket.status] = [];
      map[ticket.status].push(ticket);
    });
    Object.keys(map).forEach((key) => map[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    return map;
  }, [tickets]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const ticket = tickets.find((item) => item.id === draggableId);
    if (!ticket) return;

    onMove?.({
      ticket,
      fromStatus: source.droppableId,
      toStatus: destination.droppableId,
      fromIndex: source.index,
      toIndex: destination.index,
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        {STATUSES.map((column) => {
          const columnTickets = grouped[column.value] || [];
          return (
            <div
              key={column.value}
              className="flex min-h-[260px] flex-col rounded-2xl border border-slate-200/80 bg-slate-100/50 p-2.5"
            >
              <div className="flex items-center justify-between gap-2 px-1.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', column.dot)} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{column.label}</h3>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                    {columnTickets.length}
                  </span>
                </div>
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => onAddTicket?.(column.value)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-brand-600"
                    title={`Add ticket to ${column.label}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <Droppable droppableId={column.value} isDropDisabled={!canWrite}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'mt-1 flex min-h-[160px] flex-1 flex-col gap-2.5 rounded-xl p-1 transition-colors',
                      snapshot.isDraggingOver && 'bg-brand-50/60 ring-2 ring-inset ring-brand-200'
                    )}
                  >
                    {columnTickets.map((ticket, index) => (
                      <Draggable
                        key={ticket.id}
                        draggableId={ticket.id}
                        index={index}
                        isDragDisabled={!canWrite}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            style={dragProvided.draggableProps.style}
                          >
                            <TicketCard
                              ticket={ticket}
                              dragHandleProps={dragProvided.dragHandleProps}
                              isDragging={dragSnapshot.isDragging}
                              canDrag={canWrite}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnTickets.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                        <p className="text-[11px] font-medium text-slate-400">No tickets here</p>
                        {canWrite ? (
                          <button
                            type="button"
                            onClick={() => onAddTicket?.(column.value)}
                            className="mt-2 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                          >
                            + Add one
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
