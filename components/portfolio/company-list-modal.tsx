"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Application } from "@/lib/api/applications-api"
import { PortfolioCompany } from "@/lib/api/portfolio-companies-api"

interface CompanyListModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    data: Array<Application | PortfolioCompany>
    type: 'APPLICATION' | 'COMPANY'
}

export function CompanyListModal({
    isOpen,
    onClose,
    title,
    data,
    type
}: CompanyListModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Industry</TableHead>
                                {type === 'COMPANY' ? (
                                    <>
                                        <TableHead>Total Invested</TableHead>
                                        <TableHead>Status</TableHead>
                                    </>
                                ) : (
                                    <>
                                        <TableHead>Requested Amount</TableHead>
                                        <TableHead>Stage</TableHead>
                                    </>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {type === 'COMPANY' ? item.name : item.businessName}
                                    </TableCell>
                                    <TableCell>{item.industry}</TableCell>
                                    {type === 'COMPANY' ? (
                                        <>
                                            <TableCell>${Number(item.totalInvested || 0).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell>${Number(item.requestedAmount || 0).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {item.businessStage}
                                                </Badge>
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        No items found using this filter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}
