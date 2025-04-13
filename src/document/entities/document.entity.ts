import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "documents" })
export class DocumentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "original_name" })
  originalName: string;

  @Column({ nullable: false })
  name: string;

  @Column()
  mimeType: string;

  @Column()
  path: string;

  @CreateDateColumn()
  uploadedAt: Date;
}
