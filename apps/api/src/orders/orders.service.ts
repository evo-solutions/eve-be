import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "@app/database/database.service";
import { OrderItemEntity } from "@app/database/entities/order.entity";
import { In, Repository } from "typeorm";
import { CreateOrdersDto } from "./dto/create-orders.dto";
import { UpdateOrdersDto } from "./dto/update-orders.dto";

@Injectable()
export class OrdersService {
  private readonly repo: Repository<OrderItemEntity>;

  constructor(private readonly databaseService: DatabaseService) {
    this.repo = this.databaseService.dataSource.getRepository(OrderItemEntity);
  }

  async createMany(dto: CreateOrdersDto): Promise<OrderItemEntity[]> {
    const entities = this.repo.create(dto.items);
    return this.repo.save(entities);
  }

  async updateMany(dto: UpdateOrdersDto): Promise<OrderItemEntity[]> {
    const ids = dto.items.map((item) => item.id);
    const existing = await this.repo.find({
      where: { id: In(ids) },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException("Some orders not found");
    }

    const byId = new Map(existing.map((item) => [item.id, item]));
    for (const patch of dto.items) {
      const entity = byId.get(patch.id);
      if (!entity) {
        continue;
      }
      if (patch.conversationId !== undefined)
        entity.conversationId = patch.conversationId;
      if (patch.shippingInfo !== undefined)
        entity.shippingInfo = patch.shippingInfo;
      if (patch.orderItems !== undefined) entity.orderItems = patch.orderItems;
      if (patch.status !== undefined) entity.status = patch.status;
    }

    return this.repo.save([...byId.values()]);
  }

  async deleteMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.repo.delete(ids);
    return { deletedCount: result.affected ?? 0 };
  }

  list(conversationId?: string): Promise<OrderItemEntity[]> {
    return this.repo.find({
      where: {
        ...(conversationId ? { conversationId } : {}),
      },
      order: { createdAt: "DESC" },
    });
  }

  async detail(id: string): Promise<OrderItemEntity> {
    const order = await this.repo.findOne({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }
}
