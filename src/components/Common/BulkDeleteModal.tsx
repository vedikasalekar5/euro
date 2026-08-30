import React from 'react';
import { AlertCircle, Trash2, Check, X, Users, BookOpen } from 'lucide-react';

export interface BulkDeleteItem {
  id: string;
  primaryLabel: string;
  secondaryLabel?: string;
  tag?: string;
  subTag?: string;
}

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemTypeSingular?: string;
  itemTypePlural?: string;
  items: BulkDeleteItem[];
  isDeleting?: boolean;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemTypeSingular = 'item',
  itemTypePlural = 'items',
  items,
  isDeleting = false,
}) => {
  if (!isOpen || items.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-[#071426]/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100"
      id="bulk-delete-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#D7E3EA] space-y-5 animate-in zoom-in-95 duration-150"
        id="bulk-delete-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start gap-4 text-[#DC2626]">
          <div className="p-3.5 bg-[#FEF2F2] rounded-2xl border border-[#FECACA] shrink-0 text-[#DC2626]">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0B1F3A] tracking-tight">
              {title || `Delete Selected ${itemTypePlural}`}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              You are about to permanently delete <strong className="text-[#DC2626] font-bold font-mono">{items.length}</strong> {items.length === 1 ? itemTypeSingular : itemTypePlural}. This action cannot be reversed.
            </p>
          </div>
        </div>

        {/* Selected Items Scrollable Roster Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#172B4D] px-1">
            <span>Selected for Deletion ({items.length})</span>
            <span className="text-[11px] text-[#64748B] font-normal">Review before confirming</span>
          </div>

          <div className="max-h-52 overflow-y-auto rounded-2xl border border-[#D7E3EA] bg-[#F5F9FC] divide-y divide-[#D7E3EA] p-1 shadow-inner">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-2.5 flex items-center justify-between gap-3 text-xs bg-white rounded-xl my-0.5 first:mt-0 last:mb-0 border border-transparent hover:border-[#D7E3EA]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-[#F5F9FC] text-[#64748B] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#D7E3EA]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[#0B1F3A] truncate">
                      {item.primaryLabel}
                    </div>
                    {item.secondaryLabel && (
                      <div className="text-[11px] font-mono text-[#64748B] truncate">
                        {item.secondaryLabel}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.tag && (
                    <span className="px-2 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] text-[10px] font-semibold rounded-md border border-[#D7E3EA]">
                      {item.tag}
                    </span>
                  )}
                  {item.subTag && (
                    <span className="px-2 py-0.5 bg-[#E6FCFF] text-[#0094B3] text-[10px] font-semibold rounded-md border border-[#67E8F9]/40">
                      {item.subTag}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            All associated Unit Test 1 and Unit Test 2 marks for these {itemTypePlural} will also be safely removed from the system.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer disabled:opacity-50"
            id="cancel-bulk-delete-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            id="confirm-bulk-delete-btn"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting {items.length} records...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete {items.length} {items.length === 1 ? itemTypeSingular : itemTypePlural}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
