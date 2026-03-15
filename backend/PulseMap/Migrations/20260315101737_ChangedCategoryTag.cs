using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PulseMap.Migrations
{
    /// <inheritdoc />
    public partial class ChangedCategoryTag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Locations");

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Locations",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Slug = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "IsActive", "Name", "Slug" },
                values: new object[] { 1, true, "Not Set", "not-set" });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "IsActive", "Name", "Slug", "SortOrder" },
                values: new object[,]
                {
                    { 2, true, "Music", "music", 10 },
                    { 3, true, "Sport", "sport", 20 },
                    { 4, true, "Food", "food", 30 },
                    { 5, true, "Entertainment", "entertainment", 40 },
                    { 6, true, "Education", "education", 50 },
                    { 7, true, "Health", "health", 60 },
                    { 8, true, "Technology", "technology", 70 },
                    { 9, true, "Travel", "travel", 80 },
                    { 10, true, "Art", "art", 90 },
                    { 11, true, "Business", "business", 100 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Locations_CategoryId",
                table: "Locations",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Slug",
                table: "Categories",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Locations_Categories_CategoryId",
                table: "Locations",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Locations_Categories_CategoryId",
                table: "Locations");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Locations_CategoryId",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Locations");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Locations",
                type: "text",
                nullable: false,
                defaultValue: "NotSet");
        }
    }
}
