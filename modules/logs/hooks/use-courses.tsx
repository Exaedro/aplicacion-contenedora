"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getCoursesAction, Course } from "@/actions/courses";

interface CoursesContextType {
    courses: Course[];
    loading: boolean;
    error: string | null;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getCoursesAction();
            if (result.success && result.data) {
                setCourses(result.data);
                setError(null);
            } else {
                setError(result.error || "Error al cargar cursos");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const value = {
        courses,
        loading,
        error,
    };

    return (
        <CoursesContext.Provider value={value}>
            {children}
        </CoursesContext.Provider>
    );
}

export function useCourses() {
    const context = useContext(CoursesContext);
    if (context === undefined) {
        throw new Error("useCourses must be used within a CoursesProvider");
    }
    return context;
}
