import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "./database.service";
import { DataSource } from "typeorm";

describe("DatabaseService", () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, { provide: DataSource, useValue: {} }],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
