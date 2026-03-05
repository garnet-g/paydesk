import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'

// Define Report Card Styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: '#1e3a8a',
        paddingBottom: 20,
        marginBottom: 30
    },
    schoolInfo: {
        flexDirection: 'column',
    },
    schoolName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 4
    },
    schoolDetails: {
        fontSize: 10,
        color: '#475569',
        marginBottom: 2
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#0f172a',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    studentSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 4,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    studentInfoCol: {
        flexDirection: 'column',
        gap: 6
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    infoLabel: {
        width: 100,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b'
    },
    infoValue: {
        fontSize: 11,
        fontWeight: 'extrabold',
        color: '#0f172a'
    },
    table: {
        width: '100%',
        marginBottom: 25,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e3a8a',
        color: '#ffffff',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    tableHeaderCell: {
        padding: 8,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        alignItems: 'center',
    },
    tableCell: {
        padding: 8,
        fontSize: 10,
        color: '#334155'
    },
    colSubject: { width: '40%' },
    colScore: { width: '15%', textAlign: 'center' },
    colOutOf: { width: '15%', textAlign: 'center' },
    colGrade: { width: '15%', textAlign: 'center', fontWeight: 'bold' },
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
    },
    summaryText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        marginRight: 10
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'extrabold',
        color: '#1e3a8a',
        width: 60,
        textAlign: 'right'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10
    },
    signatureBlock: {
        flexDirection: 'column',
        alignItems: 'center',
        width: 150
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#0f172a',
        marginBottom: 5
    },
    signatureText: {
        fontSize: 9,
        color: '#64748b'
    }
})

interface ReportCardProps {
    schoolName: string
    schoolAddress?: string
    schoolPhone?: string
    studentName: string
    admissionNumber: string
    className: string
    academicPeriod: string
    examName: string
    results: Array<{
        subject: string
        score: number
        maxScore: number
        grade: string
    }>
    totalScore: number
    possibleScore: number
    averageGrade: string
}

export const ReportCardPDF = ({
    schoolName,
    schoolAddress = "PO Box 1234, Nairobi",
    schoolPhone = "+254 700 000 000",
    studentName,
    admissionNumber,
    className,
    academicPeriod,
    examName,
    results,
    totalScore,
    possibleScore,
    averageGrade
}: ReportCardProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.schoolInfo}>
                    <Text style={styles.schoolName}>{schoolName}</Text>
                    <Text style={styles.schoolDetails}>{schoolAddress}</Text>
                    <Text style={styles.schoolDetails}>Tel: {schoolPhone}</Text>
                </View>
                {/* Space for Logo */}
                <View style={{ width: 60, height: 60, backgroundColor: '#f1f5f9', borderRadius: 30 }} />
            </View>

            <Text style={styles.title}>Official Student Terminal Report</Text>

            {/* Student Info */}
            <View style={styles.studentSection}>
                <View style={styles.studentInfoCol}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Student Name:</Text>
                        <Text style={styles.infoValue}>{studentName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Admission No:</Text>
                        <Text style={styles.infoValue}>{admissionNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Class:</Text>
                        <Text style={styles.infoValue}>{className}</Text>
                    </View>
                </View>
                <View style={styles.studentInfoCol}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Academic Term:</Text>
                        <Text style={styles.infoValue}>{academicPeriod}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Examination:</Text>
                        <Text style={styles.infoValue}>{examName}</Text>
                    </View>
                </View>
            </View>

            {/* Results Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colSubject]}>Subject</Text>
                    <Text style={[styles.tableHeaderCell, styles.colScore]}>Score</Text>
                    <Text style={[styles.tableHeaderCell, styles.colOutOf]}>Max Score</Text>
                    <Text style={[styles.tableHeaderCell, styles.colGrade]}>Grade</Text>
                </View>

                {results.map((r, i) => (
                    <View key={i} style={[styles.tableRow, i % 2 === 0 ? { backgroundColor: '#f8fafc' } : {}]}>
                        <Text style={[styles.tableCell, styles.colSubject]}>{r.subject}</Text>
                        <Text style={[styles.tableCell, styles.colScore]}>{r.score}</Text>
                        <Text style={[styles.tableCell, styles.colOutOf]}>{r.maxScore}</Text>
                        <Text style={[styles.tableCell, styles.colGrade, { color: r.grade === 'E' || r.grade === 'D' ? '#ef4444' : '#10b981' }]}>{r.grade}</Text>
                    </View>
                ))}
            </View>

            {/* Summary */}
            <View style={styles.summarySection}>
                <Text style={styles.summaryText}>Total Marks:</Text>
                <Text style={styles.summaryValue}>{totalScore} / {possibleScore}</Text>
            </View>
            <View style={[styles.summarySection, { borderTopWidth: 0, marginTop: 0 }]}>
                <Text style={styles.summaryText}>Mean Grade:</Text>
                <Text style={[styles.summaryValue, { fontSize: 16 }]}>{averageGrade}</Text>
            </View>

            {/* Footer Signatures */}
            <View style={styles.footer}>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureText}>Class Teacher Signature</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureText}>Principal Signature</Text>
                </View>
            </View>
        </Page>
    </Document>
)
