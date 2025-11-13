import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardAPI } from '../../services/api';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getStats();
      return response.data.data.stats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchLeadsByStatus = createAsyncThunk(
  'dashboard/fetchLeadsByStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getLeadsByStatus();
      return response.data.data.leadsByStatus;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leads by status');
    }
  }
);

export const fetchLeadsBySource = createAsyncThunk(
  'dashboard/fetchLeadsBySource',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getLeadsBySource();
      return response.data.data.leadsBySource;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leads by source');
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  'dashboard/fetchRecentActivities',
  async (limit, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getRecentActivities(limit);
      return response.data.data.activities;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent activities');
    }
  }
);

export const fetchTeamPerformance = createAsyncThunk(
  'dashboard/fetchTeamPerformance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getTeamPerformance();
      return response.data.data.teamPerformance;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team performance');
    }
  }
);

export const fetchSalesPipeline = createAsyncThunk(
  'dashboard/fetchSalesPipeline',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getSalesPipeline();
      return response.data.data.pipeline;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales pipeline');
    }
  }
);

// Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    leadsByStatus: [],
    leadsBySource: [],
    recentActivities: [],
    teamPerformance: [],
    salesPipeline: [],
    isLoading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch leads by status
      .addCase(fetchLeadsByStatus.fulfilled, (state, action) => {
        state.leadsByStatus = action.payload;
      })
      // Fetch leads by source
      .addCase(fetchLeadsBySource.fulfilled, (state, action) => {
        state.leadsBySource = action.payload;
      })
      // Fetch recent activities
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.recentActivities = action.payload;
      })
      // Fetch team performance
      .addCase(fetchTeamPerformance.fulfilled, (state, action) => {
        state.teamPerformance = action.payload;
      })
      // Fetch sales pipeline
      .addCase(fetchSalesPipeline.fulfilled, (state, action) => {
        state.salesPipeline = action.payload;
      });
  }
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;

