import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Teacher } from "@/lib/mock-data";
import {
    getTeachersAction,
    createTeacherAction,
    updateTeacherAction,
    deleteTeacherAction,
    getTeacherByIdAction
} from "@/actions/teachers";
import { useToast } from "@/hooks/use-toast";

interface TeachersContextType {
    teachers: Teacher[];
    loading: boolean;
    error: string | null;
    addTeacher: (teacher: Omit<Teacher, "id">) => Promise<void>;
    updateTeacher: (teacher: Teacher) => Promise<void>;
    deleteTeacher: (id: string) => Promise<void>;
    getTeacherById: (id: string) => Promise<Teacher | undefined>;
    refreshTeachers: () => Promise<void>;
}

const TeachersContext = createContext<TeachersContextType | undefined>(undefined);

export function TeachersProvider({ children }: { children: ReactNode }) {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getTeachersAction();
            if (result.success && result.data) {
                setTeachers(result.data);
                setError(null);
            } else {
                setError(result.error || "Error al cargar profesores");
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "No se pudieron cargar los profesores",
                });
            }
        } catch (err) {
            setError("Error de conexión");
            toast({
                variant: "destructive",
                title: "Error",
                description: "Ocurrió un error inesperado al cargar los profesores",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    const addTeacher = async (teacherData: Omit<Teacher, "id">) => {
        try {
            const result = await createTeacherAction(teacherData);
            if (result.success && result.data) {
                setTeachers(prev => [...prev, result.data!]);
                toast({
                    title: "Éxito",
                    description: "Profesor creado correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo crear el profesor",
            });
            throw err;
        }
    };

    const updateTeacher = async (teacher: Teacher) => {
        try {
            const result = await updateTeacherAction(teacher);
            if (result.success) {
                setTeachers(prev => prev.map(t => t.id === teacher.id ? teacher : t));
                toast({
                    title: "Éxito",
                    description: "Profesor actualizado correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo actualizar el profesor",
            });
            throw err;
        }
    };

    const deleteTeacher = async (id: string) => {
        try {
            const result = await deleteTeacherAction(id);
            if (result.success) {
                setTeachers(prev => prev.filter(t => t.id !== id));
                toast({
                    title: "Éxito",
                    description: "Profesor eliminado correctamente",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "No se pudo eliminar el profesor",
            });
            throw err;
        }
    };

    const getTeacherById = async (id: string) => {
        // First try to find in local state
        const existing = teachers.find(t => t.id === id);
        if (existing) return existing;

        // If not found (e.g. direct navigation), fetch from server
        try {
            const result = await getTeacherByIdAction(id);
            if (result.success && result.data) {
                return result.data;
            }
        } catch (error) {
            console.error(error);
        }
        return undefined;
    };

    const value = {
        teachers,
        loading,
        error,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        getTeacherById,
        refreshTeachers: fetchTeachers
    };

    const TeachersContextProvider = TeachersContext.Provider;

    return (
        <TeachersContextProvider value={ value }>
            { children }
        </TeachersContextProvider>
    );
}

export function useTeachers() {
    const context = useContext(TeachersContext);
    if (context === undefined) {
        throw new Error("useTeachers must be used within a TeachersProvider");
    }
    return context;
}