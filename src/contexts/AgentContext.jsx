import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const AgentContext = createContext();

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

export const AgentProvider = ({ children }) => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch user's agents
  const fetchAgents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Use user subcollection structure: users/{userId}/agents
      const agentsRef = collection(db, 'users', user.uid, 'agents');
      const querySnapshot = await getDocs(agentsRef);
      const agentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgents(agentsData);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new agent
  const createAgent = async (agentData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newAgent = {
        ...agentData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        documentCount: agentData.documentCount || 0,
        trainingStatus: agentData.trainingStatus || 'not_trained'
      };

      console.log('🔍 [AgentContext] Creating agent with data:', {
        hasReturnDiscount: !!newAgent.returnUserDiscount,
        hasFirstTimeDiscount: !!newAgent.firstTimeDiscount,
        returnDiscount: newAgent.returnUserDiscount,
        firstTimeDiscount: newAgent.firstTimeDiscount
      });

      // Use user subcollection structure: users/{userId}/agents
      const agentsRef = collection(db, 'users', user.uid, 'agents');
      const docRef = await addDoc(agentsRef, newAgent);
      const createdAgent = { id: docRef.id, ...newAgent };

      console.log('✅ [AgentContext] Agent created with ID:', docRef.id);

      // Create agentIndex for fast lookup (agentId -> userId mapping)
      try {
        await setDoc(doc(db, 'agentIndex', docRef.id), {
          userId: user.uid,
          agentId: docRef.id,
          createdAt: new Date()
        });
        console.log('✅ [AgentContext] AgentIndex created for fast lookup');
      } catch (indexError) {
        console.error('⚠️ [AgentContext] Failed to create agentIndex, but agent was created:', indexError);
        // Don't throw - agent is already created, index is just for optimization
      }

      setAgents(prev => [...prev, createdAgent]);
      return createdAgent;
    } catch (error) {
      console.error('❌ [AgentContext] Error creating agent:', error);
      throw error;
    }
  };

  // Update agent
  const updateAgent = async (agentId, updates) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Use user subcollection structure: users/{userId}/agents/{agentId}
      const agentRef = doc(db, 'users', user.uid, 'agents', agentId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(agentRef, updateData);
      
      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, ...updateData } : agent
      ));

      if (selectedAgent?.id === agentId) {
        setSelectedAgent(prev => ({ ...prev, ...updateData }));
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  };

  // Delete agent
  const deleteAgent = async (agentId) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Delete agent from user subcollection: users/{userId}/agents/{agentId}
      await deleteDoc(doc(db, 'users', user.uid, 'agents', agentId));

      // Delete from agentIndex as well
      try {
        await deleteDoc(doc(db, 'agentIndex', agentId));
        console.log('✅ [AgentContext] AgentIndex deleted');
      } catch (indexError) {
        console.error('⚠️ [AgentContext] Failed to delete agentIndex:', indexError);
        // Don't throw - agent is already deleted, this is just cleanup
      }

      setAgents(prev => prev.filter(agent => agent.id !== agentId));

      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  };

  // Select agent for training/editing
  const selectAgent = (agent) => {
    setSelectedAgent(agent);
  };

  useEffect(() => {
    if (user) {
      fetchAgents();
    } else {
      setAgents([]);
      setSelectedAgent(null);
      setLoading(false);
    }
  }, [user]);

  const value = {
    agents,
    selectedAgent,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    selectAgent,
    fetchAgents
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};