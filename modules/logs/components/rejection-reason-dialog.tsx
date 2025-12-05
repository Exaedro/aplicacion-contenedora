"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface RejectionReasonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (reason: string) => void
}

export function RejectionReasonDialog({ open, onOpenChange, onConfirm }: RejectionReasonDialogProps) {
    const [reason, setReason] = useState("")

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason)
            setReason("")
            onOpenChange(false)
        }
    }

    const handleCancel = () => {
        setReason("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Motivo del Rechazo</DialogTitle>
                    <DialogDescription>
                        Por favor, indique el motivo por el cual se rechaza esta solicitud de licencia.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motivo *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Escriba el motivo del rechazo..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
                        Rechazar Solicitud
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
