import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { activityAPI } from '../../services/api';

// Async thunks
export const fetchActivities = createAsyncThunk(
  'activities/fetchActivities',
  async (params, { rejectWithValue }) => {
    try {
      const response = await activityAPI.getAll(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activities');
    }
  }
);

export const fetchActivitiesByLead = createAsyncThunk(
  'activities/fetchActivitiesByLead',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await activityAPI.getByLead(leadId);
      return response.data.data.activities;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activities');
    }
  }
);

export const createActivity = createAsyncThunk(
  'activities/createActivity',
  async (data, { rejectWithValue }) => {
    try {
      const response = await activityAPI.create(data);
      return response.data.data.activity;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create activity');
    }
  }
);

export const updateActivity = createAsyncThunk(
  'activities/updateActivity',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await activityAPI.update(id, data);
      return response.data.data.activity;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update activity');
    }
  }
);

export const deleteActivity = createAsyncThunk(
  'activities/deleteActivity',
  async (id, { rejectWithValue }) => {
    try {
      await activityAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete activity');
    }
  }
);

// Slice
const activitySlice = createSlice({
  name: 'activities',
  initialState: {
    activities: [],
    leadActivities: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 0
    },
    isLoading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLeadActivities: (state) => {
      state.leadActivities = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch activities
      .addCase(fetchActivities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload.activities;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch activities by lead
      .addCase(fetchActivitiesByLead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivitiesByLead.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leadActivities = action.payload;
      })
      .addCase(fetchActivitiesByLead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create activity
      .addCase(createActivity.fulfilled, (state, action) => {
        state.activities.unshift(action.payload);
        state.leadActivities.unshift(action.payload);
        state.pagination.total += 1;
      })
      // Update activity
      .addCase(updateActivity.fulfilled, (state, action) => {
        const index = state.activities.findIndex(activity => activity.id === action.payload.id);
        if (index !== -1) {
          state.activities[index] = action.payload;
        }
        const leadIndex = state.leadActivities.findIndex(activity => activity.id === action.payload.id);
        if (leadIndex !== -1) {
          state.leadActivities[leadIndex] = action.payload;
        }
      })
      // Delete activity
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.activities = state.activities.filter(activity => activity.id !== action.payload);
        state.leadActivities = state.leadActivities.filter(activity => activity.id !== action.payload);
        state.pagination.total -= 1;
      });
  }
});

export const { clearError, clearLeadActivities } = activitySlice.actions;
export default activitySlice.reducer;

