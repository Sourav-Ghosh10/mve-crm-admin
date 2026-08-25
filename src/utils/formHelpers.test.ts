import { cleanFormData } from './formHelpers';

describe('cleanFormData', () => {
    it('should clean form data correctly', () => {
        const testData = {
            isAdmin: false,
            isHolidayApplicable: true,
            employeeId: "EMP0010",
            password: "123@Reshab321",
            username: "test",
            personalInfo: {
                firstName: "PS",
                lastName: "Srijan",
                email: "info@hashtagbizsolutions.com",
                phone: "04082074794",
                dateOfBirth: "", // Empty - will be removed but personalInfo structure preserved
                address: {
                    street: "SRIJAN CORPORATE PARK",
                    city: "New Town",
                    state: "West Bengal",
                    country: "India",
                    zipCode: "700091"
                },
                emergencyContact: {
                    name: "", // Empty - will be removed but emergencyContact structure preserved
                    relationship: "",
                    phone: ""
                }
            },
            employment: {
                role: "employee",
                department: "CSA",
                designation: "UI & UX Designer",
                dateOfJoining: "2026-01-01",
                employmentType: "full-time",
                reportingManager: "69425e5013e995316cc00492",
                location: "PS Srijan",
                workingHours: {
                    startTime: "09:00",
                    endTime: "18:00",
                    weeklyOff: ["Saturday", "Sunday"]
                }
            },
            permissions: {
                modules: [],
                canApproveLeave: false,
                canApproveReimbursement: false,
                canManageSchedule: false,
                canViewReports: false
            },
            canCreateRoster: false,
            leaveBalance: {
                casual: 12,
                sick: 10,
                earned: 0,
                compOff: 0
            },
            allowedIPs: []
        };

        // Define expected structure avoiding 'any'
        type ExpectedCleanedData = {
            personalInfo?: {
                dateOfBirth?: string;
                emergencyContact?: {
                    name?: string;
                };
            };
        };
        const cleaned = cleanFormData(testData) as ExpectedCleanedData;

        expect(cleaned).toBeDefined();
        // Expect dateOfBirth to be stripped but personalInfo to remain
        expect(cleaned.personalInfo).toBeDefined();
        expect(cleaned.personalInfo?.dateOfBirth).toBeUndefined();

        // Expect emergencyContact to be stripped of empty fields
        expect(cleaned.personalInfo?.emergencyContact).toBeDefined();
        expect(cleaned.personalInfo?.emergencyContact?.name).toBeUndefined();
    });
});
