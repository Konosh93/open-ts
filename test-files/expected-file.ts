import { IsOptional, IsArray, IsInt, IsNotEmpty, Length, Matches, IsObject, MinLength, IsEmail, Min, Max, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
/*
 * This file is auto-generated. Do NOT modify this file manually.
*/
type OperationWithoutBody = (path: string, query: {
    [key: string]: any;
}) => Promise<any>;
type OperationWithBody = (path: string, body: any, query: {
    [key: string]: any;
}) => Promise<any>;
export interface HTTPClient {
    get: OperationWithoutBody;
    post: OperationWithBody;
    put: OperationWithBody;
    delete: OperationWithoutBody;
    patch: OperationWithBody;
    setHeaders: (headers: {
        [key: string]: string;
    }) => void;
}
export type FindPetsQuery = {
    tags?: string[];
    limit?: number;
};
export type Pet = {
    id: number;
};
export type FindPetsResponseBody = Pet[];
export type NewPet = {
    name: string;
    tag?: string;
    color?: string;
};
export type AddPetRequestBody = {
    petName: string;
    petData?: NewPet;
};
export type AddPetResponseBody = Pet;
export type GetCustomerQuery = {
    tags?: string[];
    limit?: number;
};
export type Customer = {
    name: string | null;
    email?: string;
    color?: string | null;
    age?: number;
    pickupHour?: number;
    birthday?: string | Date;
    verified?: boolean;
    createdAt?: string | Date;
    tags?: string[];
};
export type GetCustomerResponseBody = Customer[] | null;
export type PostCustomerRequestBody = Customer;
export type PostCustomerResponseBody = Customer | null;
export type FindPetByIdQuery = {
    lang: string;
};
export type FindPetByIdResponseBody = Pet;
export type UpdateByIdQuery = {
    lang: string;
    color?: string;
    tags?: string[];
};
export type UpdateByIdResponseBody = Pet;
export class FindPetsQueryValidator {
    /**
     * tags to filter by
     */
    @IsOptional()
    @IsArray()
    tags: string[];
    /**
     * maximum number of results to return
     */
    @IsOptional()
    @IsInt()
    limit: number;
}
export class AddPetRequestBodyValidator {
    /**
     * petName
     */
    @IsNotEmpty()
    @Length(4, 10)
    @Matches(/[a-zA-Z0-9]/)
    petName: string;
    /**
     * petData
     */
    @IsOptional()
    @IsObject()
    petData: NewPet;
}
export class GetCustomerQueryValidator {
    /**
     * tags to filter by
     */
    @IsOptional()
    @IsArray()
    tags: string[];
    /**
     * maximum number of results to return
     */
    @IsOptional()
    @IsInt()
    limit: number;
}
export class PostCustomerRequestBodyValidator {
    /**
     * name
     */
    @IsNotEmpty()
    name: string;
    /**
     * email
     */
    @IsOptional()
    @MinLength(5)
    @IsEmail()
    email: string;
    /**
     * color
     */
    @IsOptional()
    color: string;
    /**
     * The Age of the owner is needed here.
     */
    @IsOptional()
    @IsInt()
    @Min(18)
    @Max(65)
    age: number;
    /**
     * The Age of the owner is needed here.
     */
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(0)
    pickupHour: number;
    /**
     * birthday
     */
    @IsOptional()
    @Type(() => Date)
    birthday: Date;
    /**
     * verified
     */
    @IsOptional()
    @IsBoolean()
    verified: boolean;
    /**
     * createdAt
     */
    @IsOptional()
    @Type(() => Date)
    createdAt: Date;
    /**
     * tags
     */
    @IsOptional()
    @IsArray()
    tags: string[];
}
export class FindPetByIdQueryValidator {
    /**
     * Language
     */
    @IsNotEmpty()
    @IsInt
    lang: string;
}
export class UpdateByIdQueryValidator {
    /**
     * Language
     */
    @IsNotEmpty()
    @IsInt
    lang: string;
    /**
     * Color
     */
    @IsOptional()
    @IsInt
    color: string;
    /**
     * Tags List
     */
    @IsOptional()
    @IsArray()
    tags: string[];
}
export default class APIAgent {
    httpClient: HTTPClient;
    constructor(httpClient: HTTPClient) {
        this.httpClient = httpClient;
    }
    /**
     * Returns all pets from the system that the user has access to
     *
     */
    async findPets(query: FindPetsQuery) {
        return await this.httpClient.get("/pets", query) as FindPetsResponseBody;
    }
    /**
     * Creates a new pet in the store. Duplicates are allowed
     */
    async addPet(body: AddPetRequestBody) {
        return await this.httpClient.post("/pets", body, {}) as AddPetResponseBody;
    }
    /**
     * Get Customer
     */
    async getCustomer(query: GetCustomerQuery) {
        return await this.httpClient.get("/customers/", query) as GetCustomerResponseBody;
    }
    /**
     * Creates a new Customer in the store.
     */
    async postCustomer(body: PostCustomerRequestBody) {
        return await this.httpClient.post("/customers/", body, {}) as PostCustomerResponseBody;
    }
    /**
     * Returns a user based on a single ID, if the user does not have access to the pet
     */
    async findPetById(id: number, query: FindPetByIdQuery) {
        return await this.httpClient.get(`/pets/${id}`, query) as FindPetByIdResponseBody;
    }
    /**
     * Returns a user based on a single ID, if the user does not have access to the pet
     */
    async updateById(id: number, query: UpdateByIdQuery) {
        return await this.httpClient.put(`/pets/${id}`, {}, query) as UpdateByIdResponseBody;
    }
    /**
     * deletes a single pet based on the ID supplied
     */
    async deletePet(id: number) {
        return await this.httpClient.delete(`/pets/${id}`, {});
    }
}
