import { RowDataPacket } from 'mysql2';

export interface Client {
    id?: number;
    officeId?: number;
    clientId?: number;
    savingsId?: number;
    resourceId?: number;
    resourceExternalId: string;
    status: 'initiated' | 'in_progress' | 'active' | 'inactive' | 'closed';
    createDate?: Date;
    updateDate?: Date;
}

export interface ClientModel extends RowDataPacket, Client {}