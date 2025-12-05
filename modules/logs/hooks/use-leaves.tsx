"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { LeaveRequest } from "@/lib/mock-data";
import {
    getLeaveRequestsAction,
    getLeaveRequestsByTeacherIdAction,
    createLeaveRequestAction,
    updateLeaveRequestAction,
    deleteLeaveRequestAction
} from "@/actions/leaves";
import { useToast } from "@/hooks/use-toast";

interface LeavesContextType {
    leaves: LeaveRequest[];
    loading: boolean;
    error: string | null;
    addLeaveRequest: (leave: Omit<LeaveRequest, "id">) => Promise<void>;
    updateLeaveRequest: (leave: LeaveRequest) => Promise<void>;
    deleteLeaveRequest: (id: string) => Promise<void>;
    getLeaveRequestsByTeacherId: (teacherId: string) => Promise<LeaveRequest[]>;
    refreshLeaves: () => Promise<void>;
}

const LeavesContext = createContext<LeavesContextType | undefined>(undefined);

export function LeavesProvider({ children }: { children: ReactNode }) {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchLeaves = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getLeaveRequestsAction();
            if (result.success && result.data) {
                setLeaves(result.data);
                setError(null);
            } else {
                setError(result.error || "Error al cargar licencias");
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "No se pudieron cargar las licencias",
                });
            }
        } catch (err) {
            setError("Error de conexión");
            toast({
                variant: "destructive",
                title: "Error",
                description: "Ocurrió un error inesperado al cargar las licencias",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const addLeaveRequest = async (leaveData: Omit<LeaveRequest, "id">) => {
        try {
            const result = await createLeaveRequestAction(leaveData);
            if (result.success && result.data) {
                setLeaves(prev => [...prev, result.data!]);
                toast({
                    title: "Éxito",
                    description: "Licencia creada correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo crear la licencia",
            });
            throw err;
        }
    };

    const updateLeaveRequest = async (leave: LeaveRequest) => {
        try {
            const result = await updateLeaveRequestAction(leave);
            if (result.success) {
                setLeaves(prev => prev.map(l => l.id === leave.id ? leave : l));
                toast({
                    title: "Éxito",
                    description: "Licencia actualizada correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo actualizar la licencia",
            });
            throw err;
        }
    };

    const deleteLeaveRequest = async (id: string) => {
        try {
            const result = await deleteLeaveRequestAction(id);
            if (result.success) {
                setLeaves(prev => prev.filter(l => l.id !== id));
                toast({
                    title: "Éxito",
                    description: "Licencia eliminada correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo eliminar la licencia",
            });
            throw err;
        }
    };

    const getLeaveRequestsByTeacherId = async (teacherId: string) => {
        try {
            const result = await getLeaveRequestsByTeacherIdAction(teacherId);
            if (result.success && result.data) {
                return result.data;
            }
        } catch (error) {
            console.error(error);
        }
        return [];
    };

    const value = {
        leaves,
        loading,
        error,
        addLeaveRequest,
        updateLeaveRequest,
        deleteLeaveRequest,
        getLeaveRequestsByTeacherId,
        refreshLeaves: fetchLeaves
    };

    return (
        <LeavesContext.Provider value={value}>
            {children}
        </LeavesContext.Provider>
    );
}

export function useLeaves() {
    const context = useContext(LeavesContext);
    if (context === undefined) {
        throw new Error("useLeaves must be used within a LeavesProvider");
    }
    return context;
}
