using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PulseMap.Migrations
{
    /// <inheritdoc />
    public partial class AddedLikesAndOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OwnerId",
                table: "Locations",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LocationLikes",
                columns: table => new
                {
                    LocationId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationLikes", x => new { x.LocationId, x.UserId });
                    table.ForeignKey(
                        name: "FK_LocationLikes_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LocationLikes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Locations_OwnerId",
                table: "Locations",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationLikes_UserId",
                table: "LocationLikes",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Locations_Users_OwnerId",
                table: "Locations",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Locations_Users_OwnerId",
                table: "Locations");

            migrationBuilder.DropTable(
                name: "LocationLikes");

            migrationBuilder.DropIndex(
                name: "IX_Locations_OwnerId",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Locations");
        }
    }
}
