"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSubjectsAction, Subject } from "@/actions/subjects";

interface SubjectsContextType {
    subjects: Subject[];
    loading: boolean;
    error: string | null;
}

const SubjectsContext = createContext<SubjectsContextType | undefined>(undefined);

export function SubjectsProvider({ children }: { children: ReactNode }) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubjects = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getSubjectsAction();
            if (result.success && result.data) {
                setSubjects(result.data);
                setError(null);
            } else {
                setError(result.error || "Error al cargar materias");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const value = {
        subjects,
        loading,
        error,
    };

    return (
        <SubjectsContext.Provider value={value}>
            {children}
        </SubjectsContext.Provider>
    );
}

export function useSubjects() {
    const context = useContext(SubjectsContext);
    if (context === undefined) {
        throw new Error("useSubjects must be used within a SubjectsProvider");
    }
    return context;
}
