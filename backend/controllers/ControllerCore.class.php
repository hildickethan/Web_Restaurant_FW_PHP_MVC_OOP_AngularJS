<?php
/**
 * Core class to build MySQL queries
 */
class ControllerCore{
    /**
     * Goes through the array and adds WHERE conditions to the query
     *
     * @param array $array
     * @return string
     */
    private function addWhereStatement($array){
        $conditions=count($array);
        $query='';
        $limit='';
        $orderby='';
        $groupby='';
        if ($conditions>=1){
            $query = " WHERE ";
        }
        // if building non-standard where query
        // they must go before the where parameters at the end
        // ie: /api/restaurants/limit-4/id-1!

        // count needs a value but it is not used for anything
        // ie: /api/restaurants/count-1/id-1!
        foreach ($array as $row => $value){
            if ($row=='limit'){
                $limit = $this->addLimitStatement($value);
                $conditions--;
            } else if ($row=='orderby'){
                $orderby = $this->addOrderByStatementAsc($value);
                $conditions--;
            } else if ($row=='orderbydesc'){
                $orderby = $this->addOrderByStatementDesc($value);
                $conditions--;
            } else if ($row=='count'){
                $conditions--;
            } else if ($row=='groupby'){
                $groupby = $this->addGroupByStatement($value);
                $conditions--;
            } else {
                $query .= $row." LIKE '".str_replace('!','%',$value)."'"; 
                $conditions--;
                if ($conditions>0){
                    $query .= ' AND ';
                }
            }
        }
        if ($query == " WHERE "){
            // error_log(print_r($limit,1));
            return $groupby.$orderby.$limit;
        }
        return $query.$groupby.$orderby.$limit;
    }
    
    /**
     * Adds LIMIT to the query
     *
     * @param string $limit
     * @return string
     */
    private function addLimitStatement($limit){
        $query='';
        $values=explode(',',$limit);
        $query .= ' LIMIT '.$values[0];
        if (array_key_exists(1,$values)){
            $query .= ', '.$values[1];
        }
        return $query;
    }

    /**
     * Adds ORDER BY to the query
     *
     * @param string $order
     * @return string
     */
    private function addOrderByStatementAsc($order){
        $query='';
        $query .= ' ORDER BY '.$order;
        return $query;
    }

    /**
     * Adds ORDER BY DESC to the query
     *
     * @param string $order
     * @return string
     */
    private function addOrderByStatementDesc($order){
        $query='';
        $query .= ' ORDER BY '.$order.' DESC ';
        return $query;
    }

    /**
     * Adds GROUP BY to the query
     *
     * @param string $group
     * @return string
     */
    private function addGroupByStatement($group){
        $query='';
        $query .= ' GROUP BY '.$group;
        return $query;
    }

    /**
     * Runs the query in MySQL
     *
     * @param string $query
     * @return array
     */
    protected function runQuery($query){
        $connect = connect::con();
        $response = mysqli_query($connect, $query);
        connect::close($connect);
        return $response;
    }
    /**
     * Builds a GET query
     *
     * @param array $data
     * @return string
     */
    protected function buildGetQuery($data){
        $query = 'SELECT * FROM '.$this->tableName;
        if ($data!="" && is_array($data)){
            if (isset($data['count'])){
                $query = 'SELECT COUNT(*) as rowcount FROM '.$this->tableName;
            }
            $query .= $this->addWhereStatement($data);
        }
        $query = str_replace('%20', ' ', $query);
        return $query;
    }
    /**
     * Builds a POST query
     *
     * @param object $data
     * @return string
     */
    protected function buildPostQuery($data){
        if ($data!="" && is_object($data)){
            $query = 'INSERT INTO '.$this->tableName;
            $rows = ' (';
            $values = ' VALUES (';
            $endData=end($data);
            $endKey = key($data);
            unset($data->$endKey);
            foreach ($data as $row => $value){
                $rows .= $row.', ';
                $values .= '"'.$value.'", ';
            }
            $values .= '"'.$endData.'")';
            $rows .= $endKey.')';
            $query .= $rows.$values;
        }
        // error_log(print_r($query,1));
        return $query;
    }
    /**
     * Builds a PUT query
     *
     * @param array $data
     * @return string
     */
    protected function buildPutQuery($data){
        if ($data!="" && is_array($data)){
            $query = 'UPDATE '.$this->tableName.' SET ';
            foreach ($data[1] as $row => $value){
                $query .= $row.'='."'$value'";
                if ($value === end($data[1])) $query .= ' ';
                else $query .= ', ';
            }
            $query .= $this->addWhereStatement($data[0]);
        }
        // error_log(print_r($query,1));
        return $query;
    }
    /**
     * Builds a DELETE query
     *
     * @param array $data
     * @return string
     */
    protected function buildDeleteQuery($data){
        $query = 'DELETE FROM '.$this->tableName;
        $query .= $this->addWhereStatement($data);
        return $query;
    }
}