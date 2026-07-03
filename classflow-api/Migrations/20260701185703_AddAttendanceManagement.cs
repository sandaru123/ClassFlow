using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClassFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AttendanceRecords_StudentId",
                table: "AttendanceRecords");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CreatedAt",
                table: "AttendanceRecords",
                type: "datetimeoffset",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedAt",
                table: "AttendanceRecords",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_StudentId_ClassSessionId",
                table: "AttendanceRecords",
                columns: new[] { "StudentId", "ClassSessionId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AttendanceRecords_StudentId_ClassSessionId",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "AttendanceRecords");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_StudentId",
                table: "AttendanceRecords",
                column: "StudentId");
        }
    }
}
