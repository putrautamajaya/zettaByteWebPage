import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  @ViewChild('paginator') paginator: MatPaginator = {} as MatPaginator

  corrector_list: any
  school_corrector_list: any
  school_list: any
  school_table_list: any
  students_table_list: any
  search_student: string
  search_school_origin: any
  search_school_correcting: any
  search_school_corrector: any

  displayedColumns: string[] = ['student_name', 'origin', 'school_correcting', 'cross_corrector'];
  dataSource: any;
  filtered_data: any;
  display_data: any;

  right_table_colums: string[] = ['school', 'students', 'correction', 'diff']
  right_table_data: any;

  get totalAssigned() {
    return this.dataSource?.filter((d: any) => d.cross_corrector === '')?.length ?? 16
  }

  constructor(private http: HttpClient) {
    this.dataSource = undefined
    this.search_student = ''
    this.search_school_origin = ''
    this.search_school_correcting = ''
    this.search_school_corrector = ''
    this.display_data = []
  }

  async ngOnInit() {
    let observable_data = []

    observable_data.push(this.http.get(`../../zettaByteAngularTest/assets/corrector-list.json`))
    observable_data.push(this.http.get(`../../zettaByteAngularTest/assets/school-corrector-list.json`))
    observable_data.push(this.http.get(`../../zettaByteAngularTest/assets/school-list.json`))
    observable_data.push(this.http.get(`../../zettaByteAngularTest/assets/school-table-list.json`))
    observable_data.push(this.http.get(`../../zettaByteAngularTest/assets/students-table-list.json`))

    forkJoin(...observable_data).subscribe((results: any) => {
      this.corrector_list = results[0]
      this.school_corrector_list = results[1]
      this.school_list = results[2]
      this.school_table_list = results[3]
      this.students_table_list = results[4]

      this.dataSource = this.students_table_list.map((data: any) => {
        return {
          student_name: data.student_id,
          origin: data.school_origin_id,
          school_correcting: '',
          cross_corrector: ''
        }
      })

      this.filtered_data = [...this.dataSource]
      this.display_data = [...this.filtered_data].splice(0, 10)

      this.right_table_data = this.school_list.map((d: any) => {
        const students = this.dataSource.filter((student: any) => student.origin._id === d.school._id)
        return {
          _id: d.school._id,
          short_name: d.school.short_name,
          students,
          student_count: students.length,
          correction_count: 0,
          diff: 0 - students.length,
        }
      })
    });
  }

  getAvailableSchool(school_origin_id: any) {
    return this.school_list.filter((school: any) => school.school._id !== school_origin_id).map((school: any) => school.school)
  }

  getAvailableCorrector(school_corrector_id: any) {
    return this.school_corrector_list.find((school: any) => school.school._id === school_corrector_id)?.cross_correctors ?? []
  }

  getSelectedSchoolOrigin() {
    const tempt = this.filtered_data?.map((d: any) => d.origin) ?? []
    let selectedOrigin: any = []

    tempt.forEach((i: any) => {
      if (selectedOrigin.length == 0 || !selectedOrigin.find((d: any) => d._id === i._id)) {
        selectedOrigin.push(i)
      }
    });

    return selectedOrigin
  }

  getSelectedSchoolCorrecting() {
    const tempt = this.filtered_data?.map((d: any) => d.school_correcting) ?? []
    let selectedSchoolCorrecting: any = []

    tempt.forEach((i: any) => {
      if (i !== '') {
        if (selectedSchoolCorrecting.length == 0 || !selectedSchoolCorrecting.find((d: any) => d._id === i._id)) {
          selectedSchoolCorrecting.push(i)
        }
      }
    });

    return selectedSchoolCorrecting
  }

  getSelectedCorrector() {
    const tempt = this.filtered_data?.map((d: any) => d.cross_corrector) ?? []
    let selected_corrector: any = []

    tempt.forEach((i: any) => {
      if (i !== '') {
        if (selected_corrector.length == 0 || !selected_corrector.find((d: any) => d._id === i._id)) {
          selected_corrector.push(i)
        }
      }
    });

    return selected_corrector
  }

  async filterData() {
    let filtered_data = this.dataSource.filter((d: any) => (d.student_name.last_name + ' ' + d.student_name.first_name).toLowerCase().includes(this.search_student))

    if (this.search_school_origin !== '') {
      filtered_data = filtered_data.filter((d: any) => d.origin.short_name === this.search_school_origin)
    }

    if (this.search_school_correcting !== '') {
      filtered_data = filtered_data.filter((d: any) => d.school_correcting.short_name === this.search_school_correcting)
    }

    if (this.search_school_corrector !== '') {
      filtered_data = filtered_data.filter((d: any) => d.cross_corrector.full_name === this.search_school_corrector)
    }

    this.filtered_data = filtered_data

    this.display_data = [...this.filtered_data].splice(0, 10)
    this.paginator.pageIndex = 0
  }

  onPageChange(event: any) {
    this.display_data = [...this.filtered_data].splice((event.pageIndex * 10), (event.pageIndex + 1) * 10)
  }

  updateRightTableData() {
    this.right_table_data = this.school_list.map((d: any) => {
      const students = this.dataSource.filter((student: any) => student.origin._id === d.school._id)
      const correction = students.filter((student: any) => student.cross_corrector !== '')
      return {
        _id: d.school._id,
        short_name: d.school.short_name,
        students,
        student_count: students.length,
        correction_count: correction.length,
        diff: correction.length - students.length,
      }
    })
  }

  resetFilter() {
    this.search_student = ''
    this.search_school_origin = ''
    this.search_school_correcting = ''
    this.search_school_corrector = ''
    this.filterData()
  }
}
