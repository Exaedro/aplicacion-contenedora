"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Assignment } from "@/lib/mock-data";
import {
    getAssignmentsAction,
    getAssignmentsByTeacherIdAction,
    createAssignmentAction,
    updateAssignmentAction,
    deleteAssignmentAction
} from "@/actions/schedules";
import { useToast } from "@/hooks/use-toast";

interface SchedulesContextType {
    assignments: Assignment[];
    loading: boolean;
    error: string | null;
    addAssignment: (assignment: Omit<Assignment, "id">) => Promise<void>;
    updateAssignment: (assignment: Assignment) => Promise<void>;
    deleteAssignment: (id: string) => Promise<void>;
    getAssignmentsByTeacherId: (teacherId: string) => Promise<Assignment[]>;
    refreshAssignments: () => Promise<void>;
}

const SchedulesContext = createContext<SchedulesContextType | undefined>(undefined);

export function SchedulesProvider({ children }: { children: ReactNode }) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchAssignments = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAssignmentsAction();
            if (result.success && result.data) {
                setAssignments(result.data);
                setError(null);
            } else {
                setError(result.error || "Error al cargar asignaciones");
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "No se pudieron cargar las asignaciones",
                });
            }
        } catch (err) {
            setError("Error de conexión");
            toast({
                variant: "destructive",
                title: "Error",
                description: "Ocurrió un error inesperado al cargar las asignaciones",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const addAssignment = async (assignmentData: Omit<Assignment, "id">) => {
        try {
            const result = await createAssignmentAction(assignmentData);
            if (result.success && result.data) {
                setAssignments(prev => [...prev, result.data!]);
                toast({
                    title: "Éxito",
                    description: "Asignación creada correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo crear la asignación",
            });
            throw err;
        }
    };

    const updateAssignment = async (assignment: Assignment) => {
        try {
            const result = await updateAssignmentAction(assignment);
            if (result.success) {
                setAssignments(prev => prev.map(a => a.id === assignment.id ? assignment : a));
                toast({
                    title: "Éxito",
                    description: "Asignación actualizada correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo actualizar la asignación",
            });
            throw err;
        }
    };

    const deleteAssignment = async (id: string) => {
        try {
            const result = await deleteAssignmentAction(id);
            if (result.success) {
                setAssignments(prev => prev.filter(a => a.id !== id));
                toast({
                    title: "Éxito",
                    description: "Asignación eliminada correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo eliminar la asignación",
            });
            throw err;
        }
    };

    const getAssignmentsByTeacherId = async (teacherId: string) => {
        try {
            const result = await getAssignmentsByTeacherIdAction(teacherId);
            if (result.success && result.data) {
                return result.data;
            }
        } catch (error) {
            console.error(error);
        }
        return [];
    };

    const value = {
        assignments,
        loading,
        error,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        getAssignmentsByTeacherId,
        refreshAssignments: fetchAssignments
    };

    return (
        <SchedulesContext.Provider value={value}>
            {children}
        </SchedulesContext.Provider>
    );
}

export function useSchedules() {
    const context = useContext(SchedulesContext);
    if (context === undefined) {
        throw new Error("useSchedules must be used within a SchedulesProvider");
    }
    return context;
}
