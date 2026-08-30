import React, { useState, useMemo, useEffect } from 'react';
import {
  Trash2,
  AlertCircle,
  Search,
  CheckSquare,
  Square,
  X,
  Users,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

export interface SelectableDeleteItem {
  id: string;
  name: string;
  identifier?: string; // Enrollment No. or Course Code
  department?: string;
  year?: string;
  extraInfo?: string;
}

interface SelectDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (selectedIds: string[]) => Promise<boolean | void> | boolean | void;
  title?: string;
  itemTypeSingular?: string;
  itemTypePlural?: string;
  items: SelectableDeleteItem[];
}

export const SelectDeleteModal: React.FC<SelectDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  title = 'Select Students to Delete',
  itemTypeSingular = 'student',
  itemTypePlural = 'students',
  items,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('All');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setSearchQuery('');
      setSelectedDeptFilter('All');
      setSelectedYearFilter('All');
      setIsConfirming(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Extract unique departments & years for quick modal filtering if helpful
  const uniqueDepts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.department) set.add(item.department);
    });
    return Array.from(set);
  }, [items]);

  const uniqueYears = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.year) set.add(item.year);
    });
    return Array.from(set);
  }, [items]);

  // Filtered items displayed in the selection list
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.identifier && item.identifier.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q));
      const matchDept = selectedDeptFilter === 'All' || item.department === selectedDeptFilter;
      const matchYear = selectedYearFilter === 'All' || item.year === selectedYearFilter;
      return matchSearch && matchDept && matchYear;
    });
  }, [items, searchQuery, selectedDeptFilter, selectedYearFilter]);

  // Checkbox select all state
  const isAllFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every((item) => selectedIds.includes(item.id));
  }, [filteredItems, selectedIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return (
      filteredItems.some((item) => selectedIds.includes(item.id)) &&
      !isAllFilteredSelected
    );
  }, [filteredItems, selectedIds, isAllFilteredSelected]);

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredItems.map((i) => i.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const filteredIdList = filteredItems.map((i) => i.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIdList])));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleProceedToConfirm = () => {
    if (selectedIds.length === 0) return;
    setIsConfirming(true);
  };

  const handleFinalDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const result = await onConfirmDelete(selectedIds);
      if (result !== false) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedItemsList = useMemo(() => {
    const idSet = new Set(selectedIds);
    return items.filter((item) => idSet.has(item.id));
  }, [items, selectedIds]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#071426]/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100"
      id="select-delete-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#D7E3EA] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        id="select-delete-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#0B1F3A] text-white flex items-center justify-between border-b border-[#00D9FF]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#DC2626]/20 text-[#DC2626] rounded-xl border border-[#DC2626]/30">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                {isConfirming ? `Confirm Deletion` : title}
              </h3>
              <p className="text-[11px] text-[#E6FCFF]/70">
                {isConfirming
                  ? `Review selected ${itemTypePlural} before permanent removal`
                  : `Select one or multiple ${itemTypePlural} to delete`}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            id="close-select-delete-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SELECTION VIEW */}
        {!isConfirming ? (
          <div className="p-5 sm:p-6 flex flex-col flex-1 min-h-0 space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${itemTypePlural} by name, enrollment, etc...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#F5F9FC] border border-[#D7E3EA] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] text-[#0B1F3A]"
                  id="select-delete-search-input"
                />
              </div>

              {uniqueDepts.length > 1 && (
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-[#F5F9FC] border border-[#D7E3EA] focus:outline-none focus:border-[#00D9FF] text-[#0B1F3A] font-medium"
                >
                  <option value="All">All Departments</option>
                  {uniqueDepts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {uniqueYears.length > 1 && (
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-[#F5F9FC] border border-[#D7E3EA] focus:outline-none focus:border-[#00D9FF] text-[#0B1F3A] font-medium"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Select All Toggle Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] text-xs shrink-0">
              <label
                className="flex items-center gap-2.5 font-bold text-[#0B1F3A] cursor-pointer select-none"
                id="select-all-modal-label"
              >
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeFilteredSelected;
                  }}
                  onChange={toggleSelectAllFiltered}
                  className="w-4 h-4 rounded border-gray-300 text-[#00D9FF] focus:ring-[#00D9FF] cursor-pointer accent-[#00D9FF]"
                  id="select-all-modal-checkbox"
                />
                <span>Select All ({filteredItems.length})</span>
              </label>

              <span className="text-[11px] font-semibold text-[#64748B]">
                Selected:{' '}
                <strong className="text-[#0B1F3A] font-mono font-bold">
                  {selectedIds.length}
                </strong>{' '}
                {selectedIds.length === 1 ? itemTypeSingular : itemTypePlural}
              </span>
            </div>

            {/* Scrollable Items List */}
            <div
              className="flex-1 overflow-y-auto border border-[#D7E3EA] rounded-2xl divide-y divide-[#D7E3EA] bg-white p-1 min-h-[220px] max-h-[340px]"
              id="select-delete-items-list"
            >
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-[#64748B]">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#64748B]" />
                  <p className="text-xs font-semibold">No {itemTypePlural} found</p>
                  <p className="text-[11px] opacity-75 mt-0.5">Try adjusting your search query</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelectItem(item.id)}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer my-0.5 first:mt-0 last:mb-0 select-none ${
                        isChecked
                          ? 'bg-[#E6FCFF]/70 hover:bg-[#E6FCFF] border border-[#00D9FF]/40'
                          : 'hover:bg-[#F5F9FC] border border-transparent'
                      }`}
                      id={`select-item-row-${item.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-[#00D9FF] focus:ring-[#00D9FF] cursor-pointer accent-[#00D9FF] shrink-0"
                          id={`item-checkbox-${item.id}`}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#0B1F3A] truncate">
                            {item.name}
                          </div>
                          {item.identifier && (
                            <div className="text-[11px] font-mono text-[#64748B] truncate">
                              {item.identifier}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.department && (
                          <span className="px-2 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] text-[10px] font-semibold rounded-md border border-[#D7E3EA]">
                            {item.department}
                          </span>
                        )}
                        {item.year && (
                          <span className="px-2 py-0.5 bg-[#E6FCFF] text-[#0094B3] text-[10px] font-semibold rounded-md border border-[#67E8F9]/40">
                            {item.year}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Status & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#D7E3EA] shrink-0">
              <div className="text-xs font-semibold text-[#64748B]">
                Selected:{' '}
                <span className="text-[#0B1F3A] font-bold font-mono">
                  {selectedIds.length} {selectedIds.length === 1 ? itemTypeSingular : itemTypePlural}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer"
                  id="cancel-select-delete-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={handleProceedToConfirm}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#DC2626] disabled:active:scale-100"
                  id="proceed-delete-selected-btn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedIds.length === 0
                      ? 'Delete Selected'
                      : `Delete Selected (${selectedIds.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: CONFIRMATION VIEW */
          <div className="p-5 sm:p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-100">
            {/* Warning Callout */}
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#DC2626] flex items-start gap-3">
              <div className="p-2 bg-white rounded-xl text-[#DC2626] shadow-xs shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#0B1F3A]">
                  You are about to delete {selectedIds.length}{' '}
                  {selectedIds.length === 1 ? itemTypeSingular : itemTypePlural}.
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  This action cannot be undone. All associated Unit Test 1 and Unit Test 2 marks and academic performance records will be permanently removed.
                </p>
              </div>
            </div>

            {/* List of items being deleted */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#172B4D]">
                Records to be deleted ({selectedItemsList.length}):
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[#D7E3EA] bg-[#F5F9FC] divide-y divide-[#D7E3EA] p-1 shadow-inner">
                {selectedItemsList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2 flex items-center justify-between text-xs bg-white rounded-lg my-0.5 first:mt-0 last:mb-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded bg-[#F5F9FC] text-[#64748B] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#D7E3EA]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#0B1F3A] truncate">
                        {item.name}
                      </span>
                      {item.identifier && (
                        <span className="text-[10px] font-mono text-[#64748B] truncate">
                          ({item.identifier})
                        </span>
                      )}
                    </div>
                    {item.department && (
                      <span className="text-[10px] font-medium text-[#64748B] shrink-0">
                        {item.department}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#D7E3EA]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsConfirming(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                id="back-to-selection-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Selection</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleFinalDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  id="confirm-final-delete-btn"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting {selectedIds.length}...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>
                        Delete {selectedIds.length}{' '}
                        {selectedIds.length === 1 ? itemTypeSingular : itemTypePlural}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
