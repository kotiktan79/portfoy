import React, { useReducer, useMemo, useCallback, useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
  FormControl, InputLabel, Select, MenuItem, TableSortLabel, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, TablePagination, CircularProgress, Alert, Checkbox, FormGroup, FormControlLabel, Tooltip
} from '@mui/material';
import * as XLSX from 'xlsx';
import { debounce } from 'lodash';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import UploadIcon from '@mui/icons-material/Upload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GptPromptGenerator from './GptPromptGenerator'; // Doğru yolu kontrol et

// Lodash kontrolü
if (!debounce) {
  console.error('Lodash debounce fonksiyonu bulunamadı. Lütfen "npm install lodash" komutunu çalıştırın.');
}

// State management with reducer
const initialState = {
  order: 'desc',
  orderBy: 'difference',
  filterAction: 'ALL',
  searchQuery: '',
  warningThreshold: 3,
  alertThreshold: 5,
  page: 0,
  rowsPerPage: 10,
  isLoading: false,
  error: null,
  selectedRows: [],
  visibleColumns: {
    name: true,
    type: true,
    currentValue: true,
    currentPercentage: true,
    targetPercentage: true,
    difference: true,
    tradeAmount: true,
    action: true
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_SORT':
      return { ...state, order: action.order, orderBy: action.orderBy };
    case 'SET_FILTER':
      return { ...state, filterAction: action.filterAction, page: 0 };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.searchQuery, page: 0 };
    case 'SET_THRESHOLD':
      return { ...state, [action.key]: action.value };
    case 'SET_PAGINATION':
      return { ...state, page: action.page, rowsPerPage: action.rowsPerPage };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_SELECTED_ROWS':
      return { ...state, selectedRows: action.selectedRows };
    case 'SET_VISIBLE_COLUMNS':
      return { ...state, visibleColumns: action.visibleColumns };
    default:
      return state;
  }
};

// Sorting helpers
function descendingComparator(a, b, orderBy) {
  if (!a[orderBy] || !b[orderBy]) return 0;
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  if (!Array.isArray(array)) return [];
  const stabilized = array.map((el, idx) => [el, idx]);
  stabilized.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    if (cmp !== 0) return cmp;
    return a[1] - b[1];
  });
  return stabilized.map(el => el[0]);
}

export default function RebalanceTab({ rebalanceData = {}, totalValue = 0, assetTargets = {}, onDataUpdate }) {
  const { assetRebalance = [] } = rebalanceData;
  const [state, dispatch] = useReducer(reducer, initialState);
  const [aiOpen, setAiOpen] = useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);

  // Debug: Prop'ları konsola yazdır
  useEffect(() => {
    console.log('RebalanceTab Props:', {
      rebalanceData,
      assetRebalance,
      totalValue,
      assetTargets,
      onDataUpdate: !!onDataUpdate
    });
  }, [rebalanceData, assetRebalance, totalValue, assetTargets, onDataUpdate]);

  // Load saved settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('rebalanceTabSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        dispatch({ type: 'SET_SORT', order: parsed.order || 'desc', orderBy: parsed.orderBy || 'difference' });
        dispatch({ type: 'SET_FILTER', filterAction: parsed.filterAction || 'ALL' });
        dispatch({ type: 'SET_THRESHOLD', key: 'warningThreshold', value: parsed.warningThreshold || 3 });
        dispatch({ type: 'SET_THRESHOLD', key: 'alertThreshold', value: parsed.alertThreshold || 5 });
        dispatch({ type: 'SET_VISIBLE_COLUMNS', visibleColumns: parsed.visibleColumns || initialState.visibleColumns });
      }
    } catch (error) {
      console.error('localStorage ayarları yüklenirken hata:', error);
      dispatch({ type: 'SET_ERROR', error: 'Ayarlar yüklenemedi.' });
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      const settings = {
        order: state.order,
        orderBy: state.orderBy,
        filterAction: state.filterAction,
        warningThreshold: state.warningThreshold,
        alertThreshold: state.alertThreshold,
        visibleColumns: state.visibleColumns
      };
      localStorage.setItem('rebalanceTabSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('localStorage ayarları kaydedilirken hata:', error);
      dispatch({ type: 'SET_ERROR', error: 'Ayarlar kaydedilemedi.' });
    }
  }, [state.order, state.orderBy, state.filterAction, state.warningThreshold, state.alertThreshold, state.visibleColumns]);

  // Data processing
  const filteredData = useMemo(() => {
    console.log('filteredData hesaplanıyor:', { assetRebalance, filterAction: state.filterAction, searchQuery: state.searchQuery });
    if (!Array.isArray(assetRebalance)) {
      console.warn('assetRebalance geçersiz:', assetRebalance);
      dispatch({ type: 'SET_ERROR', error: 'Geçersiz veri: assetRebalance bir dizi olmalı.' });
      return [];
    }
    return assetRebalance.filter(a => {
      if (!a || typeof a !== 'object') {
        console.warn('Geçersiz varlık nesnesi:', a);
        return false;
      }
      const matchesFilter = state.filterAction === 'ALL' ||
        (state.filterAction === 'AL' && a.action?.includes('artır')) ||
        (state.filterAction === 'SAT' && a.action?.includes('azalt')) ||
        (state.filterAction === 'TUT' && a.action === 'TUT');
      const matchesSearch = (a.name || '').toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (a.type || '').toLowerCase().includes(state.searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [assetRebalance, state.filterAction, state.searchQuery]);

  // Debounced handlers
  const debouncedThresholdChange = useCallback(
    debounce((key, value) => {
      dispatch({ type: 'SET_THRESHOLD', key, value: parseFloat(value) || 0 });
    }, 300),
    []
  );

  const debouncedSearchChange = useCallback(
    debounce((value) => {
      dispatch({ type: 'SET_SEARCH', searchQuery: value });
    }, 300),
    []
  );

  // Handlers
  const handleRequestSort = useCallback((prop) => {
    dispatch({
      type: 'SET_SORT',
      order: state.orderBy === prop && state.order === 'asc' ? 'desc' : 'asc',
      orderBy: prop
    });
  }, [state.order, state.orderBy]);

  const handleFilterChange = useCallback((e) => {
    dispatch({ type: 'SET_FILTER', filterAction: e.target.value });
  }, []);

  const handleSearchChange = useCallback((e) => {
    debouncedSearchChange(e.target.value);
  }, [debouncedSearchChange]);

  const handlePageChange = useCallback((event, newPage) => {
    dispatch({ type: 'SET_PAGINATION', page: newPage });
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    dispatch({
      type: 'SET_PAGINATION',
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10)
    });
  }, []);

  const handleSelectRow = useCallback((id) => {
    dispatch({
      type: 'SET_SELECTED_ROWS',
      selectedRows: state.selectedRows.includes(id)
        ? state.selectedRows.filter(rowId => rowId !== id)
        : [...state.selectedRows, id]
    });
  }, [state.selectedRows]);

  const handleSelectAllRows = useCallback((event) => {
    console.log('handleSelectAllRows çağrıldı:', { filteredData });
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      dispatch({ type: 'SET_SELECTED_ROWS', selectedRows: [] });
      return;
    }
    dispatch({
      type: 'SET_SELECTED_ROWS',
      selectedRows: event.target.checked ? filteredData.map(a => a.id).filter(id => id) : []
    });
  }, [filteredData]);

  const handleBulkAction = useCallback(() => {
    if (!Array.isArray(assetRebalance)) {
      dispatch({ type: 'SET_ERROR', error: 'Geçersiz veri: assetRebalance bir dizi olmalı.' });
      return;
    }
    const selectedAssets = assetRebalance.filter(a => state.selectedRows.includes(a.id) && a.action?.includes('artır'));
    if (selectedAssets.length > 0) {
      onDataUpdate?.(selectedAssets);
      dispatch({ type: 'SET_SELECTED_ROWS', selectedRows: [] });
    } else {
      dispatch({ type: 'SET_ERROR', error: 'Onaylanacak uygun varlık bulunamadı.' });
    }
  }, [state.selectedRows, assetRebalance, onDataUpdate]);

  const handleExport = useCallback(() => {
    try {
      if (!Array.isArray(assetRebalance) || !assetRebalance.length) {
        throw new Error('Dışa aktarılacak veri bulunamadı.');
      }
      const data = assetRebalance.map(a => ({
        Varlık: a.name || '-',
        Tip: a.type || '-',
        'Fark (%)': a.difference || 0,
        'Al/Sat': a.action || '-'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rebalance');
      XLSX.writeFile(wb, `rebalance_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('CSV dışa aktarma hatası:', error);
      dispatch({ type: 'SET_ERROR', error: error.message || 'CSV dışa aktarma başarısız' });
    }
  }, [assetRebalance]);

  const handleImport = useCallback((event) => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    const file = event.target.files[0];
    if (!file) {
      dispatch({ type: 'SET_ERROR', error: 'Dosya seçilmedi.' });
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const isValid = jsonData.every(row =>
          row['Varlık'] &&
          row['Tip'] &&
          typeof row['Fark (%)'] === 'number' &&
          row['Al/Sat'] &&
          ['artır', 'azalt', 'TUT'].some(action => row['Al/Sat'].toString().includes(action))
        );
        if (!isValid) {
          throw new Error('Geçersiz CSV formatı: Gerekli alanlar eksik veya hatalı.');
        }

        onDataUpdate?.(jsonData);
        dispatch({ type: 'SET_LOADING', isLoading: false });
      } catch (error) {
        console.error('CSV içe aktarma hatası:', error);
        dispatch({ type: 'SET_ERROR', error: error.message || 'CSV içe aktarma başarısız' });
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    };

    reader.readAsArrayBuffer(file);
  }, [onDataUpdate]);

  const handleColumnVisibilityChange = useCallback((columnId) => {
    dispatch({
      type: 'SET_VISIBLE_COLUMNS',
      visibleColumns: {
        ...state.visibleColumns,
        [columnId]: !state.visibleColumns[columnId]
      }
    });
  }, [state.visibleColumns]);

  const sortedData = useMemo(() => {
    console.log('sortedData hesaplanıyor:', { filteredData });
    return stableSort(filteredData, getComparator(state.order, state.orderBy));
  }, [filteredData, state.order, state.orderBy]);

  const paginatedData = useMemo(() => {
    console.log('paginatedData hesaplanıyor:', { sortedData, page: state.page, rowsPerPage: state.rowsPerPage });
    const start = state.page * state.rowsPerPage;
    return sortedData.slice(start, start + state.rowsPerPage);
  }, [sortedData, state.page, state.rowsPerPage]);

  const columns = [
    { id: 'select', label: 'Seç', align: 'center', visible: true },
    { id: 'name', label: 'Varlık', align: 'left' },
    { id: 'type', label: 'Tip', align: 'left' },
    { id: 'currentValue', label: 'Değer (₺)', align: 'right' },
    { id: 'currentPercentage', label: 'Mevcut (%)', align: 'right' },
    { id: 'targetPercentage', label: 'Hedef (%)', align: 'right' },
    { id: 'difference', label: 'Fark (%)', align: 'right' },
    { id: 'tradeAmount', label: 'Al/Sat Tutarı', align: 'right' },
    { id: 'action', label: 'Öneri', align: 'center' }
  ];

  // Early return if data is invalid
  if (!assetRebalance || !Array.isArray(assetRebalance)) {
    console.warn('Geçersiz assetRebalance, erken dönüş:', assetRebalance);
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">Veri yükleniyor veya geçersiz veri. Lütfen portföy verilerini kontrol edin.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {state.error && (
        <Alert severity="error" onClose={() => dispatch({ type: 'SET_ERROR', error: null })} sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Varlık veya Tip Ara"
          size="small"
          onChange={handleSearchChange}
          sx={{ minWidth: 200 }}
          aria-label="Varlık veya tip arama"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="filter-label">Filtre</InputLabel>
          <Select
            labelId="filter-label"
            value={state.filterAction}
            label="Filtre"
            onChange={handleFilterChange}
          >
            <MenuItem value="ALL">Tümü</MenuItem>
            <MenuItem value="AL">AL</MenuItem>
            <MenuItem value="SAT">SAT</MenuItem>
            <MenuItem value="TUT">TUT</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Uyarı %"
          type="number"
          size="small"
          defaultValue={state.warningThreshold}
          onChange={(e) => debouncedThresholdChange('warningThreshold', e.target.value)}
          inputProps={{ min: 0, max: state.alertThreshold, step: 0.1 }}
          sx={{ width: 100 }}
        />
        <TextField
          label="Alarm %"
          type="number"
          size="small"
          defaultValue={state.alertThreshold}
          onChange={(e) => debouncedThresholdChange('alertThreshold', e.target.value)}
          inputProps={{ min: state.warningThreshold, max: 100, step: 0.1 }}
          sx={{ width: 100 }}
        />
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={state.isLoading || !assetRebalance.length}
          sx={{ minWidth: 100 }}
        >
          CSV İndir
        </Button>
        <Button
          component="label"
          variant="contained"
          startIcon={<UploadIcon />}
          disabled={state.isLoading}
          sx={{ minWidth: 100 }}
        >
          CSV Yükle
          <input type="file" accept=".csv" hidden onChange={handleImport} />
        </Button>
        <Button
          startIcon={<ChatBubbleIcon />}
          onClick={() => setAiOpen(true)}
          variant="outlined"
          disabled={state.isLoading}
          sx={{ minWidth: 100 }}
        >
          AI Önerisi
        </Button>
        <Button
          onClick={() => setColumnDialogOpen(true)}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Kolonlar
        </Button>
        {state.selectedRows.length > 0 && (
          <Tooltip title="Seçilen AL önerilerini onayla">
            <Button
              startIcon={<CheckCircleIcon />}
              onClick={handleBulkAction}
              variant="contained"
              color="success"
              sx={{ minWidth: 100 }}
            >
              Onayla ({state.selectedRows.length})
            </Button>
          </Tooltip>
        )}
        {state.isLoading && <CircularProgress size={24} />}
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3, borderRadius: 2 }}>
        <Table aria-label="Portföy yeniden dengeleme tablosu">
          <TableHead sx={{ bgcolor: 'secondary.main' }}>
            <TableRow>
              {columns.map(({ id, label, align }) => (
                state.visibleColumns[id] !== false && (
                  <TableCell
                    key={id}
                    align={align}
                    sx={{ color: 'white', fontWeight: 'bold' }}
                    sortDirection={state.orderBy === id ? state.order : false}
                  >
                    {id === 'select' ? (
                      <Checkbox
                        indeterminate={
                          state.selectedRows.length > 0 &&
                          state.selectedRows.length < filteredData.length
                        }
                        checked={state.selectedRows.length === filteredData.length && filteredData.length > 0}
                        onChange={handleSelectAllRows}
                        inputProps={{ 'aria-label': 'Tüm satırları seç' }}
                        disabled={!filteredData.length}
                      />
                    ) : ['name', 'type', 'action'].includes(id) ? (
                      label
                    ) : (
                      <TableSortLabel
                        active={state.orderBy === id}
                        direction={state.orderBy === id ? state.order : 'asc'}
                        onClick={() => handleRequestSort(id)}
                      >
                        {label}
                      </TableSortLabel>
                    )}
                  </TableCell>
                )
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length ? (
              paginatedData.map((a) => {
                const abs = Math.abs(a.difference || 0);
                const bg = abs >= state.alertThreshold
                  ? 'rgba(244,67,54,0.1)'
                  : abs >= state.warningThreshold
                  ? 'rgba(255,152,0,0.1)'
                  : 'transparent';

                return (
                  <TableRow
                    key={a.id}
                    sx={{ bgcolor: bg, '&:hover': { bgcolor: bg.replace('0.1', '0.2') } }}
                  >
                    {state.visibleColumns.select !== false && (
                      <TableCell align="center">
                        <Checkbox
                          checked={state.selectedRows.includes(a.id)}
                          onChange={() => handleSelectRow(a.id)}
                          inputProps={{ 'aria-label': `${a.name || 'Bilinmeyen'} seç` }}
                        />
                      </TableCell>
                    )}
                    {state.visibleColumns.name && <TableCell>{a.name || '-'}</TableCell>}
                    {state.visibleColumns.type && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              bgcolor: assetTargets?.[a.type]?.color || 'grey.500',
                              borderRadius: '50%',
                              mr: 1
                            }}
                            aria-label={`${a.type || 'Bilinmeyen'} renk göstergesi`}
                          />
                          {a.type || '-'}
                        </Box>
                      </TableCell>
                    )}
                    {state.visibleColumns.currentValue && (
                      <TableCell align="right">{(a.currentValue || 0).toLocaleString('tr-TR')}</TableCell>
                    )}
                    {state.visibleColumns.currentPercentage && (
                      <TableCell align="right">{(a.currentPercentage || 0).toFixed(2)}</TableCell>
                    )}
                    {state.visibleColumns.targetPercentage && (
                      <TableCell align="right">{(a.targetPercentage || 0).toFixed(2)}</TableCell>
                    )}
                    {state.visibleColumns.difference && (
                      <TableCell
                        align="right"
                        sx={{
                          color: a.difference > 0 ? 'error.main' : 'success.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {(a.difference > 0 ? '+' : '') + (a.difference || 0).toFixed(2)}
                      </TableCell>
                    )}
                    {state.visibleColumns.tradeAmount && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {Math.abs(a.tradeAmount || 0).toLocaleString('tr-TR')}
                      </TableCell>
                    )}
                    {state.visibleColumns.action && (
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          color: abs >= state.alertThreshold ? 'error.dark' : 'success.dark'
                        }}
                      >
                        {a.action || '-'}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  Veri bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={sortedData.length}
        rowsPerPage={state.rowsPerPage}
        page={Math.min(state.page, Math.floor(sortedData.length / state.rowsPerPage))}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        labelRowsPerPage="Satır sayısı:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />

      {/* Column Visibility Dialog */}
      <Dialog open={columnDialogOpen} onClose={() => setColumnDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Kolon Görünürlüğü</DialogTitle>
        <DialogContent>
          <FormGroup>
            {columns.filter(col => col.id !== 'select').map(({ id, label }) => (
              <FormControlLabel
                key={id}
                control={
                  <Checkbox
                    checked={state.visibleColumns[id]}
                    onChange={() => handleColumnVisibilityChange(id)}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColumnDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* AI Suggestion Dialog */}
      <Dialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="ai-suggestion-dialog"
      >
        <DialogTitle id="ai-suggestion-dialog">AI ile Öneri Al</DialogTitle>
        <DialogContent>
          <GptPromptGenerator
            totalValue={totalValue || 0}
            riskLevel={null}
            chartData={[]}
            assetTargets={assetTargets || {}}
            portfolioHistory={[]}
            additionalData={{ rebalance: assetRebalance }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}